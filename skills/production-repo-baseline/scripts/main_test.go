package main

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestPlanAndApplyBunFixture(t *testing.T) {
	repo := t.TempDir()
	writeFixture(t, repo, "package.json", "{\n  \"name\": \"fixture-app\",\n  \"packageManager\": \"bun@1.3.14\",\n  \"scripts\": {\n    \"lint\": \"echo lint\",\n    \"typecheck\": \"echo typecheck\",\n    \"test\": \"echo test\",\n    \"build\": \"echo build\"\n  }\n}\n")
	writeFixture(t, repo, "bun.lock", "# bun lock fixture\n")
	writeFixture(t, repo, "Dockerfile", "FROM oven/bun:1\n")
	result, err := plan(repo)
	if err != nil {
		t.Fatal(err)
	}
	if result.Stack != "bun" {
		t.Fatalf("stack = %q", result.Stack)
	}
	if result.PackageManager != "bun@1.3.14" {
		t.Fatalf("package manager = %q", result.PackageManager)
	}
	for _, item := range result.Changes {
		if item.Action != "create" && item.Action != "append" && item.Action != "set-package-manager" {
			continue
		}
		target := filepath.Join(repo, item.Path)
		if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(target, []byte(item.Content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	for _, path := range []string{"README.md", ".gitignore", ".env.example", ".github/workflows/ci.yml", ".github/dependabot.yml"} {
		if _, err := os.Stat(filepath.Join(repo, path)); err != nil {
			t.Fatalf("missing %s: %v", path, err)
		}
	}
	ci, _ := os.ReadFile(filepath.Join(repo, ".github/workflows/ci.yml"))
	for _, command := range []string{"bun-version-file: package.json", "bun install --frozen-lockfile", "bun run lint", "bun run typecheck", "bun run test", "bun run build"} {
		if !strings.Contains(string(ci), command) {
			t.Fatalf("CI missing %q", command)
		}
	}
	dependabot, _ := os.ReadFile(filepath.Join(repo, ".github/dependabot.yml"))
	for _, ecosystem := range []string{"bun", "docker", "github-actions"} {
		if !strings.Contains(string(dependabot), ecosystem) {
			t.Fatalf("Dependabot missing %q", ecosystem)
		}
	}
}

func TestCLIApplysFixtureEndToEnd(t *testing.T) {
	repo := t.TempDir()
	copyFixture(t, filepath.Join("testdata", "bun-app"), repo)
	command := exec.Command("go", "run", ".", "--repo", repo, "--apply", "--json")
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("CLI failed: %v\n%s", err, output)
	}
	var result report
	if err := json.Unmarshal(output, &result); err != nil {
		t.Fatalf("CLI did not emit a JSON report: %v\n%s", err, output)
	}
	if result.Stack != "bun" || result.PackageManager != "bun@1.3.14" {
		t.Fatalf("unexpected detection result: %+v", result)
	}
	for _, path := range []string{"README.md", ".gitignore", ".env.example", ".github/workflows/ci.yml", ".github/dependabot.yml"} {
		if _, err := os.Stat(filepath.Join(repo, path)); err != nil {
			t.Fatalf("CLI did not create %s: %v", path, err)
		}
	}
}

func TestCLIInitializesAnEmptyRepositoryFoundation(t *testing.T) {
	repo := t.TempDir()
	preview := exec.Command("go", "run", ".", "--repo", repo, "--json")
	if output, err := preview.CombinedOutput(); err != nil {
		t.Fatalf("empty-repo preview failed: %v\n%s", err, output)
	}
	if _, err := os.Stat(filepath.Join(repo, ".git")); !os.IsNotExist(err) {
		t.Fatalf("preview changed the empty repository: %v", err)
	}
	command := exec.Command("go", "run", ".", "--repo", repo, "--apply", "--json")
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("empty-repo CLI failed: %v\n%s", err, output)
	}
	var result report
	if err := json.Unmarshal(output, &result); err != nil {
		t.Fatalf("CLI did not emit a JSON report: %v\n%s", err, output)
	}
	if result.Stack != "unknown" || result.PackageManager != "" {
		t.Fatalf("unexpected empty-repo result: %+v", result)
	}
	for _, path := range []string{".git", "README.md", ".gitignore", ".env.example", ".github/dependabot.yml"} {
		if _, err := os.Stat(filepath.Join(repo, path)); err != nil {
			t.Fatalf("empty repo missing %s: %v", path, err)
		}
	}
	if _, err := os.Stat(filepath.Join(repo, ".github/workflows/ci.yml")); !os.IsNotExist(err) {
		t.Fatalf("empty repo must not get a fake CI workflow: %v", err)
	}
	dependabot, err := os.ReadFile(filepath.Join(repo, ".github/dependabot.yml"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(dependabot), "github-actions") || strings.Contains(string(dependabot), "package-ecosystem: \"bun\"") {
		t.Fatalf("empty repo should configure only GitHub Actions updates: %s", dependabot)
	}
}

func TestAddPackageManagerPreservesExistingJSON(t *testing.T) {
	content, err := addPackageManager("{\n  \"name\": \"fixture\"\n}\n", "bun@1.3.14")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(content, "\"name\": \"fixture\"") || !strings.Contains(content, "\"packageManager\": \"bun@1.3.14\"") {
		t.Fatalf("missing expected fields: %s", content)
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(content), &parsed); err != nil {
		t.Fatalf("modified package.json is invalid: %v", err)
	}
}

func TestPlanPreservesExistingWorkflowAndDependabot(t *testing.T) {
	repo := t.TempDir()
	writeFixture(t, repo, "package.json", "{\"name\":\"fixture\",\"packageManager\":\"bun@1.3.14\"}\n")
	writeFixture(t, repo, "bun.lock", "# fixture\n")
	writeFixture(t, repo, ".github/workflows/ci.yml", "user-owned CI\n")
	writeFixture(t, repo, ".github/dependabot.yml", "user-owned Dependabot\n")
	result, err := plan(repo)
	if err != nil {
		t.Fatal(err)
	}
	for _, item := range result.Changes {
		if item.Path == ".github/workflows/ci.yml" || item.Path == ".github/dependabot.yml" {
			if item.Action != "unchanged" {
				t.Fatalf("existing %s should be preserved, got %s", item.Path, item.Action)
			}
		}
	}
}

func TestNoScriptsDoesNotCreateInstallOnlyCI(t *testing.T) {
	repo := t.TempDir()
	writeFixture(t, repo, "package.json", "{\"name\":\"fixture\",\"packageManager\":\"bun@1.3.14\"}\n")
	writeFixture(t, repo, "bun.lock", "# fixture\n")
	result, err := plan(repo)
	if err != nil {
		t.Fatal(err)
	}
	for _, item := range result.Changes {
		if item.Path == ".github/workflows/ci.yml" {
			t.Fatalf("CI must not be generated without a verification script: %+v", item)
		}
	}
	if !strings.Contains(strings.Join(result.ManualFollowUps, "\n"), "no CI workflow was generated") {
		t.Fatalf("missing explicit CI follow-up: %+v", result.ManualFollowUps)
	}
}

func TestMissingPackageManagerDoesNotCreateCI(t *testing.T) {
	repo := t.TempDir()
	writeFixture(t, repo, "package.json", "{\"name\":\"fixture\",\"scripts\":{\"test\":\"echo test\"}}\n")
	writeFixture(t, repo, "bun.lock", "# fixture\n")
	t.Setenv("PATH", t.TempDir())
	result, err := plan(repo)
	if err != nil {
		t.Fatal(err)
	}
	for _, item := range result.Changes {
		if item.Path == ".github/workflows/ci.yml" {
			t.Fatalf("CI must not be generated without a package-manager pin: %+v", item)
		}
	}
	if !strings.Contains(strings.Join(result.ManualFollowUps, "\n"), "No package-manager pin is available") {
		t.Fatalf("missing explicit package-manager follow-up: %+v", result.ManualFollowUps)
	}
}

func writeFixture(t *testing.T, root, relative, content string) {
	t.Helper()
	path := filepath.Join(root, relative)
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func copyFixture(t *testing.T, source, destination string) {
	t.Helper()
	entries, err := os.ReadDir(source)
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range entries {
		from := filepath.Join(source, entry.Name())
		to := filepath.Join(destination, entry.Name())
		if entry.IsDir() {
			if err := os.MkdirAll(to, 0o755); err != nil {
				t.Fatal(err)
			}
			copyFixture(t, from, to)
			continue
		}
		content, err := os.ReadFile(from)
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(to, content, 0o644); err != nil {
			t.Fatal(err)
		}
	}
}
