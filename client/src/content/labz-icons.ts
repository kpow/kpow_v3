// Sixteen seed icons from the 8x8 labz catalog (kpow/8x8, web/seed/catalog.json),
// so these pages can show real pixel art without calling the catalog API — which
// needs a login or a device key. Each icon is 64 indices into COLORS, one char
// each (0-9 then a-z); "0" is the off pixel, which renders as unlit panel.

export const COLORS: readonly string[] = [
  "#000000", "#FF0000", "#FF8000", "#FFFF00", "#00FF00", "#0000FF", "#8000FF", "#FF0080", "#FFFFFF", "#808080", "#FFD07A", "#F0FFFF", "#FEBA00", "#30E4D7", "#218381", "#111111", "#063B58", "#DF0253", "#947BE8", "#D9B9FC", "#D81D55", "#F8B707", "#F1DD74", "#F879F7", "#FFF3FF", "#A97C1A"
];

export interface PixelIcon {
  slug: string;
  name: string;
  /** 64 chars, row-major from the top left; each is an index into COLORS. */
  px: string;
}

export const ICONS: readonly PixelIcon[] = [
  { slug: "heart", name: "Heart", px: "0000000001100110111111111111111111111111011111100011110000011000" },
  { slug: "star", name: "Star", px: "0003300000033000003333003333333303333330003333000330033033000033" },
  { slug: "fire", name: "Fire", px: "0001000000111000001210000123210001232100123332101233321001222100" },
  { slug: "ghost", name: "Ghost", px: "0088880008888880880880888808808888888888888888888888888880800808" },
  { slug: "invader", name: "invader", px: "d0dddfdf0dddddf0dd0d0ddfee0e0eefeeeeeeefg0g0g0g0g0g0g0g0g0g0g0g0" },
  { slug: "mushroom", name: "Mushroom", px: "0011110001111a10111a111111111a110111111000bbba0000bbba00000ba000" },
  { slug: "dragon", name: "dragon", px: "00h0h0000iiii000i0i0ik00iiiii00000jjik000ijii00i00jjiii000i0i000" },
  { slug: "rainbow", name: "Rainbow", px: "0012340001123450110000562200006633000077440000110556711000667100" },
  { slug: "skull", name: "Skull", px: "0088880008888880880880888808808888888888088008800080080000088000" },
  { slug: "popsicle", name: "popsicle", px: "000nn00000nonn0000onnn0000nnnn0000nnnn0000nnnn00000pp000000pp000" },
  { slug: "music", name: "Music", px: "0000888800008008000080080000800000008000088080008888800008800000" },
  { slug: "potion", name: "Potion", px: "0009900000099000009999000911119091181119911111199111111909999990" },
  { slug: "alien", name: "Alien", px: "0040040000044000004444000440044044444444404444044040040400044000" },
  { slug: "chicken", name: "chicken", px: "00111000008880000888880008088880c88888880888888800888880000cc000" },
  { slug: "twinkle_heart", name: "twinkleheart", px: "01101100111111101111101001110l000010lml000010l000000000000000000" },
  { slug: "pacman", name: "Pacman", px: "0003330000333330033333000333300003333000033333000033333000033300" },
];

export const ICON_BY_SLUG: Record<string, PixelIcon> = Object.fromEntries(ICONS.map((i) => [i.slug, i]));
