import { BATCH_01 } from "./batch-01";
import { BATCH_02 } from "./batch-02";
import { BATCH_03 } from "./batch-03";
import { BATCH_04 } from "./batch-04";
import { BATCH_05 } from "./batch-05";
import type { FunctionArticle } from "./types";

export const ARTICLES_PATH = "/article";

/** Articles go public in groups so we can watch how Google treats each one. Raise this to release the next group. */
export const RELEASED_BATCHES = 1;
export const RELEASE_BATCH_SIZE = 20;

/** Released first, because they are what people search for most. Everything else follows in written order. */
const FIRST_RELEASE = ["sumifs", "countifs", "averageifs", "xlookup", "vlookup", "index", "match", "filter", "unique", "sortby", "if", "iferror", "countif", "sumif", "sum", "trim", "text", "left", "datedif", "sumproduct"];

const WRITTEN: FunctionArticle[] = [...BATCH_01, ...BATCH_02, ...BATCH_03, ...BATCH_04, ...BATCH_05];

export const ALL_FUNCTION_ARTICLES: FunctionArticle[] = [
  ...FIRST_RELEASE.flatMap((slug) => WRITTEN.filter((a) => a.slug === slug)),
  ...WRITTEN.filter((a) => !FIRST_RELEASE.includes(a.slug)),
];

/** Only these have pages, sitemap entries and links. */
export const FUNCTION_ARTICLES = ALL_FUNCTION_ARTICLES.slice(0, RELEASED_BATCHES * RELEASE_BATCH_SIZE);
export const findFunctionArticle = (slug: string) => FUNCTION_ARTICLES.find((a) => a.slug === slug);
export type { FunctionArticle } from "./types";
