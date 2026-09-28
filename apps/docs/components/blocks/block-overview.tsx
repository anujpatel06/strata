'use client';

import { IconArrowUpRight } from '@strata/icons';
import { Card, CardDescription, CardFooter, CardHeader, CardMedia, CardTitle, Link, ThemeScope } from '@strata/react';
import { BLOCK_COMPONENTS } from './block-components';
import { DraftCopyNote } from '@/components/page/draft-copy-note';
import type { BlockTenant } from './block-data';
import styles from './block-overview.module.css';

export interface BlockOverviewItem {
  name: string;
  title: string;
  description: string;
  categories: string[];
  /** The tenant the thumbnail is drawn in, and that tenant's content for the block. */
  tenant: BlockTenant;
  content: Record<string, unknown> | undefined;
}

/**
 * The /blocks overview: every block as a showcase card. The block itself, live, is the media: laid out at four times
 * the thumbnail's width and scaled down to fit (so it renders its desktop layout), in a different tenant per card.
 * The thumbnail is a picture of the viewer below it, so it's hidden from assistive tech and inert (no tab stops
 * inside); the title link is the card's one target and jumps to that viewer. "View block" opens the block alone.
 */
export function BlockOverview({ items }: { items: BlockOverviewItem[] }) {
  return (
    <nav aria-labelledby="blocks-overview" className={styles.overview}>
      <h2 id="blocks-overview" className="visually-hidden">
        Blocks on this page
      </h2>
      <ul className={styles.grid}>
        {items.map((item, i) => {
          const Block = BLOCK_COMPONENTS[item.name];
          return (
            <li key={item.name} className={styles.item}>
              <Card variant="showcase" interactive className={styles.card}>
                {/* The media carries the preview tenant's tokens, so each card's haze is the brand it shows (the site's
                    own brand is monochrome). Only the media: the card's text stays on the site's proven pairs. */}
                <CardMedia data-strata-theme={item.tenant.id} data-strata-scheme="site">
                  <div className={styles.window} aria-hidden="true" inert>
                    <div className={styles.canvas}>
                      <ThemeScope
                        theme={item.tenant.id}
                        data-strata-scheme="site"
                        locale={item.tenant.locale}
                        className={styles.scope}
                      >
                        {Block && <Block content={item.content} headingLevel={4} />}
                      </ThemeScope>
                    </div>
                  </div>
                </CardMedia>
                <CardHeader>
                  <CardDescription className={styles.eyebrow}>
                    <span className={styles.number}>{String(i + 1).padStart(2, '0')}</span>
                    <span aria-hidden="true">·</span>
                    {item.categories.join(', ')}
                  </CardDescription>
                  <CardTitle level={3}>
                    <a href={`#${item.name}`}>{item.title}</a>
                  </CardTitle>
                  <CardDescription className={styles.description}>{item.description}</CardDescription>
                  {/* In the card's text (site chrome), not on the thumbnail: the footer stays one line so the rails
                      still line up across the row. */}
                  <DraftCopyNote review={item.tenant.copyReview} className={styles.copyNote} />
                </CardHeader>
                <CardFooter divider>
                  <span>Shown in {item.tenant.name}</span>
                  <Link
                    variant="standalone"
                    href={`/blocks/${item.name}/view?tenant=${item.tenant.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.view}
                  >
                    View block
                    <span className="visually-hidden">: {item.title}, opens in a new tab</span>
                    <IconArrowUpRight data-directional />
                  </Link>
                </CardFooter>
              </Card>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
