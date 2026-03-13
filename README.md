# tree-sitter-fstar

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [F\*](https://fstar-lang.org/), a proof-oriented programming language.

## Features

- Module declarations (`module`, `open`, `include`, `friend`, module abbreviations)
- Declarations (`val`, `let`/`let rec`, `type` with inductive/record/abbreviation bodies, `exception`, `assume`, `effect`, `class`)
- Expressions with full operator precedence (23 levels)
- Pattern matching (constructor, cons, or, as, typed, tuple, list, record)
- Types (refinement, dependent arrow, effect-annotated)
- Binders (explicit, implicit `#`, typeclass `{|...|}`), refinement types
- Literals (integers with hex/octal/binary/suffixes, strings, chars, booleans, unit)
- Nested block comments `(* (* ... *) *)` via external scanner
- Pragmas (`#set-options`, `#push-options`, `#pop-options`, `#reset-options`, `#restart-solver`)
- Syntax highlighting queries for Neovim

## Development

This project uses [Nix](https://nixos.org/) with [numtide/blueprint](https://github.com/numtide/blueprint) for development.

### Prerequisites

- [Nix](https://nixos.org/) with flakes enabled

### Getting started

```sh
# Enter the development shell
nix develop

# Generate the parser from grammar.js
tree-sitter generate

# Run tests
tree-sitter test

# Parse an example file
tree-sitter parse examples/HelloWorld.fst
```

### Testing with Neovim

The devshell includes a Neovim instance pre-configured with the F\* parser and [catppuccin](https://github.com/catppuccin/nvim) colorscheme:

```sh
nix develop
nvim examples/Factorial.fst
```

### Project structure

```
grammar.js                    # Grammar definition
src/scanner.c                 # External scanner for nested block comments
queries/highlights.scm        # Syntax highlighting queries (Neovim style)
test/corpus/                  # Test cases
examples/                     # Sample F* files
nix/                          # Nix configuration
  devshell.nix                # Development shell
  packages/tree-sitter-fstar.nix  # Nix package
  treefmt.nix                 # Formatter configuration
```

## License

MIT
