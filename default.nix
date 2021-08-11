{ pkgs ? import ./nixpkgs.nix {} }:

with pkgs;

let
  inherit (rust.packages.stable) rustPlatform;
in

{
  hc-client = stdenv.mkDerivation rec {
    name = "hc-client";
    src = gitignoreSource ./.;

    buildInputs = [
      holochain
      hc
      lair-keystore
      cargo
      jq
    ];

    nativeBuildInputs = [
    ];
  };
}
