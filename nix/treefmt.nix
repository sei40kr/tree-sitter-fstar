_: {
  projectRootFile = "flake.nix";

  settings.global.excludes = [
    "src/parser.c"
    "src/grammar.json"
    "src/node-types.json"
    "src/tree_sitter/*"
  ];

  programs = {
    nixfmt.enable = true;
    prettier.enable = true;
    clang-format.enable = true;
  };
}
