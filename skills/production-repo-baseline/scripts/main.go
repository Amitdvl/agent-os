// production-repo-baseline creates only the portable, repository-owned part of
// a production baseline. It is deliberately preview-first and never changes
// GitHub account settings, deployment, credentials, or product infrastructure.
package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type change struct {
	Path    string `json:"path"`
	Action  string `json:"action"`
	Reason  string `json:"reason"`
	Content string `json:"-"`
}

type report struct {
	Repo               string   `json:"repo"`
	Stack              string   `json:"stack"`
	PackageManager     string   `json:"packageManager"`
	DetectedScripts    []string `json:"detectedScripts"`
	Changes            []change `json:"changes"`
	ConditionalModules []string `json:"conditionalModules"`
	ManualFollowUps    []string `json:"manualFollowUps"`
}

func main() {
	repo := flag.String("repo", "", "absolute or relative repository path")
	initMode := flag.String("init", "", "initialize an empty repo: bun, bun-react, bun-react-tailwind, or bun-react-shadcn")
	apply := flag.Bool("apply", false, "write only missing baseline files")
	jsonOutput := flag.Bool("json", false, "write a JSON report to stdout")
	flag.Parse()
	if *repo == "" {
		fail(errors.New("--repo is required; example: go run . --repo ../my-app --apply"))
	}
	absRepo, err := filepath.Abs(*repo)
	if err != nil {
		fail(err)
	}
	info, err := os.Stat(absRepo)
	if err != nil || !info.IsDir() {
		fail(fmt.Errorf("--repo must be an existing directory: %s", absRepo))
	}
	result, err := planFor(absRepo, *initMode)
	if err != nil {
		fail(err)
	}
	if *apply {
		if *initMode != "" {
			if err := bootstrapBun(absRepo, *initMode); err != nil {
				fail(err)
			}
			result, err = plan(absRepo)
			if err != nil {
				fail(err)
			}
			result.Changes = append([]change{{Path: ".", Action: "initialize", Reason: "create the requested Bun project shape with Bun's official initializer"}}, result.Changes...)
		}
		for _, item := range result.Changes {
			if item.Action != "create" && item.Action != "append" && item.Action != "set-package-manager" {
				continue
			}
			target := filepath.Join(absRepo, item.Path)
			if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
				fail(err)
			}
			if err := os.WriteFile(target, []byte(item.Content), 0o644); err != nil {
				fail(err)
			}
		}
	}
	if *jsonOutput {
		encoded, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			fail(err)
		}
		fmt.Println(string(encoded))
		return
	}
	verb := "Preview"
	if *apply {
		verb = "Applied"
	}
	fmt.Printf("%s production baseline for %s (%s)\n", verb, result.Repo, result.Stack)
	for _, item := range result.Changes {
		fmt.Printf("%-20s %s — %s\n", item.Action, item.Path, item.Reason)
	}
	if len(result.ManualFollowUps) > 0 {
		fmt.Println("Manual follow-ups:")
		for _, item := range result.ManualFollowUps {
			fmt.Printf("- %s\n", item)
		}
	}
}

func planFor(repo, initMode string) (report, error) {
	if initMode == "" {
		return plan(repo)
	}
	if !validBunMode(initMode) {
		return report{}, fmt.Errorf("unsupported --init value %q; use bun, bun-react, bun-react-tailwind, or bun-react-shadcn", initMode)
	}
	if err := assertEmptyRepo(repo); err != nil {
		return report{}, err
	}
	scratch, err := os.MkdirTemp("", "production-repo-baseline-")
	if err != nil {
		return report{}, err
	}
	defer os.RemoveAll(scratch)
	if err := bootstrapBun(scratch, initMode); err != nil {
		return report{}, err
	}
	result, err := plan(scratch)
	if err != nil {
		return result, err
	}
	result.Repo = filepath.Base(repo)
	result.Changes = append([]change{{Path: ".", Action: "initialize", Reason: "create the requested Bun project shape with Bun's official initializer"}}, result.Changes...)
	return result, nil
}

func validBunMode(mode string) bool {
	return mode == "bun" || mode == "bun-react" || mode == "bun-react-tailwind" || mode == "bun-react-shadcn"
}

func assertEmptyRepo(repo string) error {
	entries, err := os.ReadDir(repo)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.Name() != ".git" {
			return fmt.Errorf("--init only operates on an empty repository; found %s", entry.Name())
		}
	}
	return nil
}

func bootstrapBun(repo, mode string) error {
	args := []string{"init", "--yes"}
	switch mode {
	case "bun-react":
		args = append(args, "--react")
	case "bun-react-tailwind":
		args = append(args, "--react=tailwind")
	case "bun-react-shadcn":
		args = append(args, "--react=shadcn")
	case "bun":
	default:
		return fmt.Errorf("unsupported Bun initializer: %s", mode)
	}
	if err := runIn(repo, "bun", args...); err != nil {
		return fmt.Errorf("Bun initializer failed: %w", err)
	}
	if err := ensureBunVerificationScripts(repo); err != nil {
		return err
	}
	if err := runIn(repo, "bun", "install", "--lockfile-only"); err != nil {
		return fmt.Errorf("Bun lockfile generation failed: %w", err)
	}
	return nil
}

func ensureBunVerificationScripts(repo string) error {
	path := filepath.Join(repo, "package.json")
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read generated package.json: %w", err)
	}
	var manifest map[string]any
	if err := json.Unmarshal(content, &manifest); err != nil {
		return fmt.Errorf("parse generated package.json: %w", err)
	}
	scripts, ok := manifest["scripts"].(map[string]any)
	if !ok {
		scripts = map[string]any{}
		manifest["scripts"] = scripts
	}
	if _, exists := scripts["build"]; !exists {
		entry := bunEntryPoint(repo)
		if entry != "" {
			scripts["build"] = fmt.Sprintf("bun build ./%s --outdir ./dist", entry)
		}
	}
	next, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return fmt.Errorf("encode generated package.json: %w", err)
	}
	if err := os.WriteFile(path, append(next, '\n'), 0o644); err != nil {
		return fmt.Errorf("write generated package.json: %w", err)
	}
	return nil
}

func bunEntryPoint(repo string) string {
	for _, candidate := range []string{"index.ts", "index.tsx", "src/index.ts", "src/index.tsx"} {
		if exists(filepath.Join(repo, candidate)) {
			return candidate
		}
	}
	return ""
}

func runIn(directory, command string, args ...string) error {
	run := exec.Command(command, args...)
	run.Dir = directory
	output, err := run.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s %s: %w\n%s", command, strings.Join(args, " "), err, strings.TrimSpace(string(output)))
	}
	return nil
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, "production-repo-baseline:", err)
	os.Exit(1)
}

func plan(repo string) (report, error) {
	result := report{
		Repo: filepath.Base(repo),
		ConditionalModules: []string{
			"deployment target and release/rollback policy",
			"database migrations, backups, and recovery",
			"authentication, authorization, and data retention",
			"observability, alerting, and on-call ownership",
		},
	}
	packageJSON, packageManager, scripts, err := inspectPackageJSON(filepath.Join(repo, "package.json"))
	if err != nil {
		return result, err
	}
	result.DetectedScripts = scripts
	stack, lockfile := detectStack(repo)
	result.Stack = stack
	result.PackageManager = packageManager
	if stack == "unknown" {
		result.ManualFollowUps = append(result.ManualFollowUps, "No supported lockfile was found. Choose a package manager and create a committed lockfile before enabling dependency updates.")
	} else if lockfile == "" {
		result.ManualFollowUps = append(result.ManualFollowUps, "A package manifest exists but its lockfile is missing. Install dependencies with the chosen package manager and commit the generated lockfile.")
	}

	if stack == "bun" && packageManager == "" && packageJSON != "" {
		if version := commandVersion("bun", "--version"); version != "" {
			content, err := addPackageManager(packageJSON, "bun@"+version)
			if err != nil {
				return result, err
			}
			result.PackageManager = "bun@" + version
			result.Changes = append(result.Changes, change{Path: "package.json", Action: "set-package-manager", Reason: "pin the Bun runtime/package manager used to reproduce this repository", Content: content})
		} else {
			result.ManualFollowUps = append(result.ManualFollowUps, "Bun is not available to pin. Install the intended Bun version, then rerun the baseline.")
		}
	}
	if (stack == "npm" || stack == "pnpm" || stack == "yarn") && packageManager == "" && packageJSON != "" {
		if version := commandVersion(stack, "--version"); version != "" {
			content, err := addPackageManager(packageJSON, stack+"@"+version)
			if err != nil {
				return result, err
			}
			result.PackageManager = stack + "@" + version
			result.Changes = append(result.Changes, change{Path: "package.json", Action: "set-package-manager", Reason: "pin the package manager used to reproduce this repository", Content: content})
		}
	}
	if stack == "npm" || stack == "pnpm" || stack == "yarn" {
		if version := strings.TrimPrefix(commandVersion("node", "--version"), "v"); version != "" {
			planMissing(repo, &result, ".node-version", version+"\n", "create", "pin the Node runtime used by CI and local development")
		} else {
			result.ManualFollowUps = append(result.ManualFollowUps, "Node is not available to pin. Install the intended Node version, then rerun the baseline.")
		}
	}
	if packageJSON == "" {
		result.ManualFollowUps = append(result.ManualFollowUps, "No package.json was found. Add a stack-specific deterministic verify command before creating CI.")
	}

	appendIgnored(repo, &result)
	planMissing(repo, &result, ".env.example", "# Copy this file to .env for local development.\n# Keep real secrets outside version control.\n", "create", "document the local secret boundary")
	planReadme(repo, &result)
	if stack != "unknown" && lockfile != "" {
		if result.PackageManager == "" {
			result.ManualFollowUps = append(result.ManualFollowUps, "No package-manager pin is available, so no CI workflow was generated. Pin the active package manager and rerun the baseline.")
		} else {
			planCI(repo, &result, stack, scripts)
		}
		planDependabot(repo, &result, stack)
	}
	result.ManualFollowUps = append(result.ManualFollowUps,
		"Enable GitHub Dependabot alerts and automatic security-fix PRs in the repository settings (or use the GitHub CLI with an explicitly named repository).",
		"Choose whether protected branches require pull requests; this baseline does not impose a merge policy.",
	)
	return result, nil
}

func inspectPackageJSON(path string) (string, string, []string, error) {
	content, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return "", "", nil, nil
	}
	if err != nil {
		return "", "", nil, err
	}
	var parsed struct {
		PackageManager string            `json:"packageManager"`
		Scripts        map[string]string `json:"scripts"`
	}
	if err := json.Unmarshal(content, &parsed); err != nil {
		return "", "", nil, fmt.Errorf("invalid package.json: %w", err)
	}
	scripts := make([]string, 0, 4)
	for _, name := range []string{"lint", "typecheck", "test", "build"} {
		if parsed.Scripts[name] != "" {
			scripts = append(scripts, name)
		}
	}
	return string(content), parsed.PackageManager, scripts, nil
}

func detectStack(repo string) (string, string) {
	for _, candidate := range []struct{ stack, file string }{
		{"bun", "bun.lock"}, {"pnpm", "pnpm-lock.yaml"}, {"npm", "package-lock.json"}, {"yarn", "yarn.lock"},
	} {
		if exists(filepath.Join(repo, candidate.file)) {
			return candidate.stack, candidate.file
		}
	}
	return "unknown", ""
}

func commandVersion(name string, args ...string) string {
	output, err := exec.Command(name, args...).Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

func appendIgnored(repo string, result *report) {
	path := filepath.Join(repo, ".gitignore")
	existing, err := os.ReadFile(path)
	if err != nil && !os.IsNotExist(err) {
		return
	}
	required := []string{"node_modules/", ".env", ".env.*", "!.env.example"}
	missing := []string{}
	for _, line := range required {
		if !containsLine(string(existing), line) {
			missing = append(missing, line)
		}
	}
	if len(missing) == 0 {
		result.Changes = append(result.Changes, change{Path: ".gitignore", Action: "unchanged", Reason: "already ignores dependencies and local environment files"})
		return
	}
	content := string(existing)
	if content != "" && !strings.HasSuffix(content, "\n") {
		content += "\n"
	}
	content += "\n# Local dependencies and secrets\n" + strings.Join(missing, "\n") + "\n"
	action := "append"
	if len(existing) == 0 {
		action = "create"
	}
	result.Changes = append(result.Changes, change{Path: ".gitignore", Action: action, Reason: "ignore local dependencies and secrets without hiding .env.example", Content: content})
}

func containsLine(content, target string) bool {
	for _, line := range strings.Split(content, "\n") {
		if strings.TrimSpace(line) == target {
			return true
		}
	}
	return false
}

func planMissing(repo string, result *report, relativePath, content, action, reason string) {
	if exists(filepath.Join(repo, relativePath)) {
		result.Changes = append(result.Changes, change{Path: relativePath, Action: "unchanged", Reason: "already present"})
		return
	}
	result.Changes = append(result.Changes, change{Path: relativePath, Action: action, Reason: reason, Content: content})
}

func planReadme(repo string, result *report) {
	content := "# Project\n\n## Development\n\nInstall the pinned package manager and dependencies, then run the repository scripts.\n\n## Verification\n\nRun linting, type checks, tests, and the production build before merging.\n"
	planMissing(repo, result, "README.md", content, "create", "document local setup and verification")
}

func planCI(repo string, result *report, stack string, scripts []string) {
	path := ".github/workflows/ci.yml"
	if exists(filepath.Join(repo, path)) {
		result.Changes = append(result.Changes, change{Path: path, Action: "unchanged", Reason: "existing CI workflow preserved for review"})
		return
	}
	install := "npm ci"
	setup := "actions/setup-node@v4\n        with:\n          node-version-file: .node-version\n          cache: npm"
	if stack == "bun" {
		install = "bun install --frozen-lockfile"
		setup = "oven-sh/setup-bun@v2\n        with:\n          bun-version-file: package.json"
	} else if stack == "pnpm" {
		install = "corepack enable\n          pnpm install --frozen-lockfile"
		setup = "actions/setup-node@v4\n        with:\n          node-version-file: .node-version\n          cache: pnpm"
	} else if stack == "yarn" {
		install = "corepack enable\n          yarn install --immutable"
		setup = "actions/setup-node@v4\n        with:\n          node-version-file: .node-version\n          cache: yarn"
	}
	steps := []string{}
	for _, script := range scripts {
		steps = append(steps, fmt.Sprintf("      - run: %s run %s", stack, script))
	}
	if len(steps) == 0 {
		result.ManualFollowUps = append(result.ManualFollowUps, "Add at least one verification script (lint, typecheck, test, or build); no CI workflow was generated because an install-only job is not a production verification baseline.")
		return
	}
	installStep := "      - run: " + install
	if strings.Contains(install, "\n") {
		installStep = "      - run: |\n          " + strings.ReplaceAll(install, "\n", "\n          ")
	}
	content := fmt.Sprintf("name: Verify\n\non:\n  pull_request:\n  push:\n\npermissions:\n  contents: read\n\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: %s\n%s\n%s\n", setup, installStep, strings.Join(steps, "\n"))
	planMissing(repo, result, path, content, "create", "run deterministic install and every detected verification script on pull requests")
}

func planDependabot(repo string, result *report, stack string) {
	path := ".github/dependabot.yml"
	if exists(filepath.Join(repo, path)) {
		result.Changes = append(result.Changes, change{Path: path, Action: "unchanged", Reason: "existing Dependabot policy preserved for review"})
		return
	}
	ecosystem := stack
	if stack == "pnpm" || stack == "yarn" {
		ecosystem = "npm"
	}
	ecosystems := []string{ecosystem}
	if exists(filepath.Join(repo, "Dockerfile")) {
		ecosystems = append(ecosystems, "docker")
	}
	ecosystems = append(ecosystems, "github-actions")
	parts := []string{"version: 2", "", "updates:"}
	for _, ecosystem := range ecosystems {
		parts = append(parts, fmt.Sprintf("  - package-ecosystem: %q\n    directory: \"/\"\n    schedule:\n      interval: \"weekly\"\n    cooldown:\n      default-days: 2", ecosystem))
	}
	planMissing(repo, result, path, strings.Join(parts, "\n")+"\n", "create", "open weekly, two-day-cooled dependency update PRs for committed production inputs")
}

func addPackageManager(content, value string) (string, error) {
	var decoded map[string]json.RawMessage
	if err := json.Unmarshal([]byte(content), &decoded); err != nil {
		return "", fmt.Errorf("invalid package.json: %w", err)
	}
	if _, ok := decoded["packageManager"]; ok {
		return content, nil
	}
	trimmed := strings.TrimRight(content, " \t\r\n")
	if !strings.HasSuffix(trimmed, "}") {
		return "", errors.New("package.json must end with a JSON object")
	}
	prefix := strings.TrimRight(strings.TrimSuffix(trimmed, "}"), " \t\r\n")
	body := strings.TrimSpace(prefix)
	comma := ""
	if body != "{" {
		comma = ","
	}
	encoded, _ := json.Marshal(value)
	return prefix + comma + "\n  \"packageManager\": " + string(encoded) + "\n}\n", nil
}

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
