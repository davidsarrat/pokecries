# Third-party notices

The MIT License in this repository applies only to original source code authored for PokéCries. It does not grant rights to Pokémon names, characters, sprites, cries, artwork, audio, fonts, or other third-party material.

## PokéAPI data and assets

PokéCries references Pokémon identifiers, names, and type metadata and loads sprites and cries at runtime from the following projects:

- [PokéAPI](https://github.com/PokeAPI/pokeapi), distributed under the BSD 3-Clause License. Its license notes that Pokémon and Pokémon character names are trademarks of Nintendo.
- [PokéAPI sprites](https://github.com/PokeAPI/sprites), pinned to commit `1435ac9b294901a0d3e8874aa69d76d038c1d65d`. Its license states that the image contents are copyright The Pokémon Company.
- Generation I–V cries are loaded as MP3 files from [Pokémon Showdown](https://play.pokemonshowdown.com/audio/cries/). PokéAPI's pinned legacy cry collection is retained only as a fallback for unknown identifiers.
- Pokémon type metadata is loaded from the PokéAPI CSV data pinned to commit `9bea2b6eaa1f8f2c8d068b535f61dd75fce4a205`.
- Animated generation menu icons are loaded from the pinned PokéAPI sprites source above.

These external assets are not included in this repository and are not covered by its MIT License.

## Typeface

[Pocket Monk](https://www.dafont.com/pocket-monk.font) was created by [Chequered Ink](https://chequered.ink/). It is loaded at runtime from [CDNFonts](https://fonts.cdnfonts.com/pocket-monk.font), with [WFonts](https://www.wfonts.com/font/pocket-monk) as a fallback. The typeface is free for personal, non-commercial use; commercial use requires the appropriate license from the designer. The font is not included in this repository and is not covered by its MIT License.

## Local sound

`public/media/sounds/shiny.mp3` is third-party material retained for the non-commercial fan experience. Its source has not been identified, and it is not covered by the MIT License.
