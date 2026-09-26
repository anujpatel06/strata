'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/** Props every block shares. `content` is the block's own content type; the docs pass a tenant's JSON. */
export interface BlockProps {
  content?: unknown;
  headingLevel?: 1 | 2 | 3 | 4;
}

const as = (c: unknown) => c as ComponentType<BlockProps>;

/**
 * Block components by name (= folder in apps/docs/blocks and registry item). Each is its own chunk, so the
 * full-page view of one block doesn't load the other four. Server-rendered as usual.
 */
export const BLOCK_COMPONENTS: Record<string, ComponentType<BlockProps>> = {
  'dashboard-overview': dynamic(() => import('@/blocks/dashboard-overview/dashboard-overview').then((m) => as(m.DashboardOverview))),
  'request-flow': dynamic(() => import('@/blocks/request-flow/request-flow').then((m) => as(m.RequestFlow))),
  settings: dynamic(() => import('@/blocks/settings/settings').then((m) => as(m.Settings))),
  'sign-in': dynamic(() => import('@/blocks/sign-in/sign-in').then((m) => as(m.SignIn))),
  'activity-table': dynamic(() => import('@/blocks/activity-table/activity-table').then((m) => as(m.ActivityTable))),
};
