export const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ');
export function parseRatings(html) {
  const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('A fonte de jogadores mudou de formato. Tenta novamente mais tarde.');
  const page = JSON.parse(match[1]).props?.pageProps;
  if (page?.gameDetails?.slug !== 'fc-27') throw new Error('A fonte não confirmou a edição FC 27. Importação suspensa para evitar dados de outra edição.');
  if (!Array.isArray(page.ratingDetails?.items)) throw new Error('A fonte não devolveu uma lista de jogadores.');
  const valid = page.ratingDetails.items.filter(p => p.id && Number.isFinite(p.overallRating));
  return { total: page.ratingDetails.totalItems, players: valid.slice(0, 15).map(p => {
    const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ');
    const name = p.commonName || fullName;
    const stat = key => Number.isFinite(p.stats?.[key]?.value) ? p.stats[key].value : null;
    return {
      ea_id: String(p.id), name, full_name: fullName, card_name: 'Carta base FC 27', card_type: 'base',
      overall: p.overallRating, primary_position: p.position?.shortLabel || null,
      alternate_positions: (p.alternatePositions || []).map(x => x.shortLabel).filter(Boolean),
      club: p.team?.label || null, league: p.leagueName || null, nation: p.nationality?.label || null,
      pace: stat('pac'), shooting: stat('sho'), passing: stat('pas'), dribbling: stat('dri'), defending: stat('def'), physical: stat('phy'),
      weak_foot: p.weakFootAbility ?? null, skill_moves: p.skillMoves ?? null,
      playstyles: (p.playerAbilities || []).filter(x => x.type?.id === 'playStyle').map(x => x.label),
      playstyles_plus: (p.playerAbilities || []).filter(x => x.type?.id === 'playStylePlus').map(x => x.label),
      image_url: p.avatarUrl?.startsWith('https://ratings-images-prod.pulse.ea.com/') ? p.avatarUrl : null,
      source: 'ea_fc27', source_url: 'https://www.ea.com/games/ea-sports-fc/ratings?search=' + encodeURIComponent(name)
    };
  }) };
}
