{ pkgs, ... }:
pkgs.tree-sitter.buildGrammar {
  language = "fstar";
  version = "0.2.0";
  src = ../..;
  meta = {
    description = "Tree-sitter grammar for F*";
    license = pkgs.lib.licenses.mit;
  };
}
