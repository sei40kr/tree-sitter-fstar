{ inputs, pkgs, ... }:
let
  pre-commit-check = import ./checks/pre-commit-check.nix { inherit inputs pkgs; };

  tree-sitter-fstar = import ./packages/tree-sitter-fstar.nix { inherit pkgs; };

  neovim-fstar = pkgs.neovim.override {
    configure = {
      packages.fstar = {
        start = [
          pkgs.vimPlugins.catppuccin-nvim
          (pkgs.vimPlugins.nvim-treesitter.withPlugins (_: [ tree-sitter-fstar ]))
        ];
      };
      customRC = ''
        lua <<EOF
        vim.filetype.add({ extension = { fst = "fstar", fsti = "fstar" } })
        vim.api.nvim_create_autocmd("FileType", {
          pattern = "fstar",
          callback = function() vim.treesitter.start() end,
        })
        EOF
        colorscheme catppuccin
      '';
    };
  };
in
pkgs.mkShell {
  packages = [
    pkgs.nodejs
    pkgs.tree-sitter
    neovim-fstar
  ];

  shellHook = ''
    ${pre-commit-check.shellHook}
  '';
}
