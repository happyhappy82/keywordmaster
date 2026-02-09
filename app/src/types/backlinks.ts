// 백링크 요약 정보
export interface BacklinkSummary {
  target: string;
  rank: number;
  backlinks: number;
  backlinks_spam_score: number;
  referring_domains: number;
  referring_main_domains: number;
  referring_ips: number;
  referring_subnets: number;
  referring_pages: number;
  dofollow: number;
  nofollow: number;
  anchor: number;
  image: number;
  canonical: number;
  redirect: number;
  referring_domains_nofollow: number;
  referring_links_tld: Record<string, number>;
  referring_links_types: Record<string, number>;
  referring_links_attributes: Record<string, number>;
  referring_links_platform_types: Record<string, number>;
  referring_links_semantic_locations: Record<string, number>;
  referring_links_countries: Record<string, number>;
}

// 개별 백링크 항목
export interface BacklinkItem {
  type: string;
  domain_from: string;
  url_from: string;
  url_to: string;
  domain_to: string;
  page_from_rank: number;
  domain_from_rank: number;
  domain_from_is_ip: boolean;
  domain_from_ip: string;
  domain_from_country: string;
  page_from_external_links: number;
  page_from_internal_links: number;
  page_from_size: number;
  page_from_encoding: string;
  page_from_language: string;
  page_from_title: string;
  first_seen: string;
  last_seen: string;
  item_type: string;
  is_new: boolean;
  is_lost: boolean;
  backlink_spam_score: number;
  rank: number;
  page_from_rank_value: number;
  anchor: string;
  text_pre: string;
  text_post: string;
  dofollow: boolean;
  original: boolean;
  alt: string;
  image_url: string;
  is_indirect_link: boolean;
}

// 참조 도메인
export interface ReferringDomain {
  type: string;
  domain: string;
  rank: number;
  backlinks: number;
  first_seen: string;
  last_seen: string;
  backlinks_spam_score: number;
  broken_backlinks: number;
  broken_pages: number;
  referring_domains: number;
  referring_main_domains: number;
  referring_ips: number;
  referring_subnets: number;
  referring_pages: number;
  referring_links_tld: Record<string, number>;
  referring_links_types: Record<string, number>;
  referring_links_attributes: Record<string, number>;
  referring_links_platform_types: Record<string, number>;
  referring_links_semantic_locations: Record<string, number>;
  referring_links_countries: Record<string, number>;
}

// 앵커 텍스트
export interface AnchorItem {
  anchor: string;
  backlinks: number;
  domains: number;
  referring_domains: number;
  referring_pages: number;
  first_seen: string;
  last_seen: string;
  rank: number;
  dofollow: number;
  nofollow: number;
  referring_links_types: Record<string, number>;
  referring_links_attributes: Record<string, number>;
}

// 백링크 히스토리
export interface BacklinkHistoryItem {
  type: string;
  date: string;
  rank: number;
  backlinks: number;
  new_backlinks: number;
  lost_backlinks: number;
  new_referring_domains: number;
  lost_referring_domains: number;
  referring_domains: number;
  referring_main_domains: number;
  referring_ips: number;
  referring_subnets: number;
  referring_pages: number;
}

// 신규/손실 백링크 타임시리즈
export interface NewLostItem {
  date: string;
  type: string;
  new_backlinks: number;
  lost_backlinks: number;
  new_referring_domains: number;
  lost_referring_domains: number;
}

// 경쟁사 분석
export interface CompetitorItem {
  target: string;
  rank: number;
  backlinks: number;
  referring_domains: number;
  referring_main_domains: number;
  first_seen: string;
  avg_position: number;
  intersections: number;
}

// 대량 분석
export interface BulkRankItem {
  target: string;
  rank: number;
  backlinks: number;
  referring_domains: number;
  referring_main_domains: number;
  referring_ips: number;
  referring_subnets: number;
  referring_pages: number;
  backlinks_spam_score: number;
}

// 서브탭 타입
export type BacklinkSubTab =
  | 'overview'
  | 'backlinks'
  | 'referring-domains'
  | 'anchors'
  | 'history'
  | 'new-lost'
  | 'competitors'
  | 'bulk';
