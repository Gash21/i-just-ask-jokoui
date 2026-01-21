#!/bin/bash
# I Just Ask JokoUI MCP Server - Universal Installation Script
# Installs and configures the MCP server for various LLM tools/editors

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_PATH="$REPO_ROOT/dist/index.js"

COLORS=(
    '\033[0;32m'  # Red
    '\033[1;32m'  # Green
    '\033[0;34m'  # Blue
    '\033[0;35m'  # Yellow
    '\033[0;36m'  # Cyan
    '\033[0;37m'  # White
    '\033[0;90m'  # Bright Black
    '\033[0;95m'  # Bright White
    '\033[0m'       # Reset
)

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'
BRIGHT_BLACK='\033[0;90m'
BRIGHT_WHITE='\033[0;95m'
NC='\033[0m'

info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

check_node_version() {
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js >= 18.0.0"
        exit 1
    fi

    local node_version=$(node -v | cut -d'v' -f1)
    local required_version="18.0.0"

    if [ "$(printf '%s\n' "$node_version" "$required_version" | sort -V | head -n1)" != "$node_version" ]; then
        warn "Node.js version $node_version is below recommended $required_version"
    else
        success "Node.js version: $node_version"
    fi
}

check_dist_file() {
    if [ ! -f "$DIST_PATH" ]; then
        error "Built file not found: $DIST_PATH"
        echo "Run 'npm run build' first"
        exit 1
    fi

    if [ ! -x "$DIST_PATH" ]; then
        warn "Built file is not executable"
        echo "Run: chmod +x $DIST_PATH"
    fi
}

detect_environment() {
    info "Detecting LLM environment..."

    if [ -n "$CODE_EDITOR" ]; then
        CODE_EDITOR="$(
            command -v code &> /dev/null && echo "vscode" ||
            command -v cursor &> /dev/null && echo "cursor" ||
            command -v zed &> /dev/null && echo "zed" ||
            echo "unknown"
        )"
        info "Detected editor: $CODE_EDITOR"
    fi

    if [ -n "$OPCODE" ]; then
        CODE_EDITOR="opencode"
        info "Detected environment: OpenCode"
    fi

    if [ -n "$CURSOR" ]; then
        CODE_EDITOR="cursor"
        info "Detected environment: Cursor"
    fi

    if [ -n "$CLAUDE" ]; then
        CODE_EDITOR="claude-desktop"
        info "Detected environment: Claude Desktop"
    fi

    if [ -n "$CONTINUE" ]; then
        CODE_EDITOR="continue-dev"
        info "Detected environment: Continue.dev"
    fi
}

install_for_claude_desktop() {
    info "Configuring for Claude Desktop..."

    local config_dir="$HOME/Library/Application Support/Claude"
    local config_file="$config_dir/claude_desktop_config.json"

    mkdir -p "$config_dir"

    if [ -f "$config_file" ]; then
        info "Updating existing Claude Desktop config..."
        if command -v jq &> /dev/null; then
            tmp_config=$(jq --argjson "$DIST_PATH" '.mcpServers.jokoui.command = "node" | .mcpServers.jokoui.args = ["$DIST_PATH"]' "$config_file")
            echo "$tmp_config" > "$config_file"
            success "Updated claude_desktop_config.json"
        else
            warn "jq not found. Updating manually..."
            cat > "$config_file" << EOF
{
  "mcpServers": {
    "jokoui": {
      "command": "node",
      "args": ["$DIST_PATH"]
    }
  }
}
EOF
        fi
    else
        info "Creating new Claude Desktop config..."
        cat > "$config_file" << EOF
{
  "mcpServers": {
    "jokoui": {
      "command": "node",
      "args": ["$DIST_PATH"]
    }
  }
}
EOF
        success "Created claude_desktop_config.json"
    fi

    echo ""
    success "Installation complete!"
    info "Please restart Claude Desktop to load the MCP server."
}

install_for_opencode() {
    info "Configuring for OpenCode..."

    local config_file="$HOME/.config/opencode/opencode.json"
    local config_dir=$(dirname "$config_file")

    mkdir -p "$config_dir"

    if [ -f "$config_file" ]; then
        info "Updating existing OpenCode config..."

        if command -v jq &> /dev/null; then
            tmp_config=$(jq --argjson "$DIST_PATH" '.mcp.jokoui.command = "node" | .mcp.jokoui.args = ["$DIST_PATH"]' "$config_file")
            echo "$tmp_config" > "$config_file"
            success "Updated opencode.json"
        else
            warn "jq not found. Updating manually..."
            cat > "$config_file" << EOF
{
  "mcp": {
    "jokoui": {
      "command": "node",
      "args": [
        "$DIST_PATH"
      ]
    }
  }
}
EOF
        fi
    else
        info "Creating new OpenCode config..."
        cat > "$config_file" << EOF
{
  "mcp": {
    "jokoui": {
      "command": "node",
      "args": [
        "$DIST_PATH"
      ]
    }
  }
}
EOF
        success "Created opencode.json"
    fi

    echo ""
    success "Installation complete!"
    info "The MCP server will be available in OpenCode."
}

install_for_cursor() {
    info "Configuring for Cursor..."

    local rules_file="$REPO_ROOT/.cursorrules"
    local config_needed=false

    mkdir -p "$REPO_ROOT/.cursor"

    if [ -f "$rules_file" ]; then
        info "Found existing .cursorrules"

        if grep -q "jokoui" "$rules_file"; then
            success "Joko UI MCP Server already configured in .cursorrules"
            config_needed=true
        else
            info "Adding Joko UI to .cursorrules..."

            cat >> "$rules_file" << 'EOF'

# I Just Ask JokoUI MCP Server Configuration
You can access Joko UI components directly via MCP. The server is located at:

File: $DIST_PATH

Available Tools:
- list_components: Browse all Joko UI components
- search_components: Search by name, description, or tags
- get_component_code: Get component code templates
- fetch_component: Fetch actual code from jokoui.web.id
- implement_component: Write component code to a file
- fetch_and_implement_component: Combined fetch + write operation

Usage Examples:
- "Show me all Joko UI components"
- "Find hero section component and implement it in ./src/components/Hero.tsx"
- "Search for pricing tables"
EOF
            success "Added Joko UI configuration to .cursorrules"
            config_needed=true
        fi
    else
        info "Creating .cursorrules file..."

        cat > "$rules_file" << 'EOF'

# I Just Ask JokoUI MCP Server Configuration
You can access Joko UI components directly via MCP. The server is located at:

File: $DIST_PATH

Available Tools:
- list_components: Browse all Joko UI components
- search_components: Search by name, description, or tags
- get_component_code: Get component code templates
- fetch_component: Fetch actual code from jokoui.web.id
- implement_component: Write component code to a file
- fetch_and_implement_component: Combined fetch + write operation

Usage Examples:
- "Show me all Joko UI components"
- "Find hero section component and implement it in ./src/components/Hero.tsx"
- "Search for pricing tables"
EOF
        success "Created .cursorrules"
        config_needed=true
    fi

    echo ""
    success "Configuration complete!"
    info "Restart Cursor to load the MCP server."
}

install_for_coder() {
    info "Configuring for Coder / VS Code with Claude..."

    local settings_file="$HOME/.vscode/settings.json"
    local settings_dir=$(dirname "$settings_file")

    mkdir -p "$settings_dir"

    info "Note: For VS Code with Claude extensions, use the extension settings instead"
    echo ""
    warn "VS Code MCP setup requires Claude Code extension installed"
    echo "You may need to:"
    echo "  1. Install Claude Code extension"
    echo "  2. Configure extension settings with this MCP server"
    echo ""
    info "Server path: $DIST_PATH"
    info "Use path: $DIST_PATH in Claude Code extension settings"
}

install_generic() {
    local tool_name="$1"
    local config_file="$2"
    local config_dir=$(dirname "$config_file")

    mkdir -p "$config_dir"

    info "Configuring for $tool_name..."

    if [ -f "$config_file" ]; then
        info "Updating existing $tool_name config..."
        if command -v jq &> /dev/null; then
            tmp_config=$(jq --argjson "$DIST_PATH" '.mcp.jokoui.command = "node" | .mcp.jokoui.args = ["$DIST_PATH"]' "$config_file")
            echo "$tmp_config" > "$config_file"
            success "Updated config"
        else
            cat > "$config_file" << EOF
{
  "mcp": {
    "jokoui": {
      "command": "node",
      "args": [
        "$DIST_PATH"
      ]
    }
  }
}
EOF
        fi
    else
        info "Creating new $tool_name config..."
        cat > "$config_file" << EOF
{
  "mcp": {
    "jokoui": {
      "command": "node",
      "args": [
        "$DIST_PATH"
      ]
    }
  }
}
EOF
        success "Created config"
    fi

    echo ""
    success "Configuration complete!"
    info "Restart $tool_name to load the MCP server."
}

show_help() {
    cat << 'EOF'
${BRIGHT_WHITE}I Just Ask JokoUI MCP Server - Universal Installation${NC}

${CYAN}Usage:${NC}
  bash install.sh [options] [tool]

${CYAN}Options:${NC}
  ${GREEN}-h, --help${NC}      Show this help message
  ${GREEN}-b, --build${NC}    Build the MCP server before installation
  ${GREEN}-c, --check${NC}    Check installation prerequisites
  ${GREEN}-u, --uninstall${NC}  Uninstall MCP server from all tools

${CYAN}Tools (auto-detected if no tool specified):${NC}
  ${GREEN}claude${NC}          Claude Desktop
  ${GREEN}opencode${NC}        OpenCode
  ${GREEN}cursor${NC}          Cursor
  ${GREEN}continue${NC}        Continue.dev
  ${GREEN}coder${NC}           Coder / VS Code + Claude
  ${GREEN}all${NC}            Configure all available tools

${CYAN}Examples:${NC}
  bash install.sh claude          # Install for Claude Desktop
  bash install.sh opencode        # Install for OpenCode
  bash install.sh cursor          # Install for Cursor
  bash install.sh all              # Configure all detected tools

${CYAN}Notes:${NC}
  • This script detects your LLM tool/editor automatically
  • Use ${GREEN}-c, --check${NC} to verify prerequisites
  • Use ${GREEN}-b, --build${NC} to build before installation
  • Use ${GREEN}-u, --uninstall${NC} to remove MCP server from all configs
  • The MCP server path is: ${CYAN}$DIST_PATH${NC}

${CYAN}Documentation:${NC}
  For detailed setup instructions, see: ${CYAN}README.md${NC}
  For OpenCode-specific docs, see: ${CYAN}README.md#opencode-installation${NC}

EOF
}

uninstall() {
    local tool="$1"

    if [ -z "$tool" ]; then
        info "Uninstalling from all tools..."

        if [ -f "$HOME/.config/opencode/opencode.json" ]; then
            if command -v jq &> /dev/null; then
                jq 'del(.mcp.jokoui)' "$HOME/.config/opencode/opencode.json" > /tmp/opencode.json
                mv /tmp/opencode.json "$HOME/.config/opencode/opencode.json"
                success "Removed from OpenCode"
            else
                sed -i '' '/jokoui/d' "$HOME/.config/opencode/opencode.json"
                success "Removed from OpenCode (jq not available)"
            fi
        fi

        if [ -f "$REPO_ROOT/.cursorrules" ]; then
            sed -i '' '/Joko UI MCP Server Configuration/,/^# Joko UI MCP Server Configuration/d' "$REPO_ROOT/.cursorrules"
            sed -i '' '/File: $DIST_PATH/,/File:.*$DIST_PATH/d' "$REPO_ROOT/.cursorrules"
            success "Removed from Cursor"
        fi

        if [ -f "$HOME/Library/Application Support/Claude/claude_desktop_config.json" ]; then
            if command -v jq &> /dev/null; then
                jq 'del(.mcpServers.jokoui)' "$HOME/Library/Application Support/Claude/claude_desktop_config.json" > /tmp/claude.json
                mv /tmp/claude.json "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
                success "Removed from Claude Desktop"
            else
                rm "$HOME/Library/Application Support/Claude/claude_desktop_config.json" 2>/dev/null
                success "Removed from Claude Desktop (jq not available)"
            fi
        fi

        echo ""
        success "Uninstallation complete!"
    else
        info "Uninstalling from $tool..."

        case "$tool" in
            "claude")
                if [ -f "$HOME/Library/Application Support/Claude/claude_desktop_config.json" ]; then
                    if command -v jq &> /dev/null; then
                        jq 'del(.mcpServers.jokoui)' "$HOME/Library/Application Support/Claude/claude_desktop_config.json" > /tmp/claude.json
                        mv /tmp/claude.json "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
                        success "Removed from Claude Desktop"
                    else
                        rm "$HOME/Library/Application Support/Claude/claude_desktop_config.json" 2>/dev/null
                        success "Removed from Claude Desktop (jq not available)"
                    fi
                else
                    warn "No Claude Desktop configuration found"
                fi
                ;;
            "opencode")
                if [ -f "$HOME/.config/opencode/opencode.json" ]; then
                    if command -v jq &> /dev/null; then
                        jq 'del(.mcp.jokoui)' "$HOME/.config/opencode/opencode.json" > /tmp/opencode.json
                        mv /tmp/opencode.json "$HOME/.config/opencode/opencode.json"
                        success "Removed from OpenCode"
                    else
                        sed -i '' '/jokoui/d' "$HOME/.config/opencode/opencode.json"
                        success "Removed from OpenCode (jq not available)"
                    fi
                else
                    warn "No OpenCode configuration found"
                fi
                ;;
            "cursor")
                if [ -f "$REPO_ROOT/.cursorrules" ]; then
                    sed -i '' '/Joko UI MCP Server Configuration/,/^# Joko UI MCP Server Configuration/d' "$REPO_ROOT/.cursorrules"
                    sed -i '' '/File: $DIST_PATH/,/File:.*$DIST_PATH/d' "$REPO_ROOT/.cursorrules"
                    success "Removed from Cursor"
                else
                    warn "No Cursor configuration found"
                fi
                ;;
            *)
                error "Unknown tool: $tool"
                exit 1
                ;;
        esac
    fi
}

build_server() {
    info "Building I Just Ask JokoUI MCP Server..."

    if command -v npm &> /dev/null; then
        npm install
        npm run build
    else
        error "npm not found. Please install Node.js and npm first."
        exit 1
    fi

    check_dist_file
    success "Build complete! dist/index.js created"
}

check_prerequisites() {
    info "Checking prerequisites..."

    check_node_version
    check_dist_file

    if command -v jq &> /dev/null; then
        success "jq: installed"
    else
        warn "jq: not found (optional, will use sed/awk)"
    fi

    echo ""
    success "All prerequisites met!"
}

show_menu() {
    echo ""
    echo -e "${CYAN}┌────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC}  ${BRIGHT_WHITE}I Just Ask JokoUI MCP Server - Universal Installation${NC}         ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}                                                 ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${CYAN}Select LLM Tool to Configure:${NC}         ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}                                                 ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}[1]${NC} Claude Desktop                          ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}[2]${NC} OpenCode                                ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}[3]${NC} Cursor                                  ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}[4]${NC} Continue.dev                              ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}[5]${NC} Coder / VS Code + Claude                   ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}[6]${NC} All Tools                               ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}[7]${NC} Help                                    ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC}  ${GREEN}[0]${NC} Exit                                    ${CYAN}│${NC}"
    echo -e "${CYAN}└────────────────────────────────────────────────────────┘${NC}"
    echo ""

    read -p "Select an option [1-7]: " choice

    case $choice in
        1)
            install_for_claude_desktop
            ;;
        2)
            install_for_opencode
            ;;
        3)
            install_for_cursor
            ;;
        4)
            install_for_continue
            ;;
        5)
            install_for_coder "Coder"
            ;;
        6)
            install_generic "Continue.dev" "$HOME/.continue/config.json"
            ;;
        7)
            install_for_generic "Zed" "$HOME/.zed/settings.json"
            ;;
        0)
            show_help
            ;;
        *)
            error "Invalid option"
            show_menu
            ;;
    esac
}

main() {
    local tool=""
    local build_only=false
    local check_only=false
    local uninstall_mode=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -b|--build)
                build_only=true
                shift
                ;;
            -c|--check)
                check_only=true
                shift
                ;;
            -u|--uninstall)
                uninstall_mode=true
                shift
                tool="$1"
                ;;
            claude|opencode|cursor|continue|coder|zed|all)
                tool="$1"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    detect_environment

    if $check_only; then
        check_prerequisites
        exit 0
    fi

    if $build_only; then
        build_server
        exit 0
    fi

    if $uninstall_mode; then
        uninstall "$tool"
        exit 0
    fi

    if [ -z "$tool" ]; then
        show_menu
    else
        case "$tool" in
            claude)
                install_for_claude_desktop
                ;;
            opencode)
                install_for_opencode
                ;;
            cursor)
                install_for_cursor
                ;;
            continue)
                install_for_continue
                ;;
            coder)
                install_for_coder
                ;;
            all)
                install_for_claude_desktop
                install_for_opencode
                install_for_cursor
                install_for_continue
                install_for_coder "Zed" "$HOME/.zed/settings.json"
                echo ""
                success "All tools configured!"
                ;;
            *)
                error "Unknown tool: $tool"
                echo "Run 'bash install.sh --help' for usage"
                exit 1
                ;;
        esac
    fi
}

main "$@"
