// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { useState, useEffect, useRef } from 'react';
import { globalHistory } from '@reach/router';
import replace from 'lodash/replace';
import find from 'lodash/find';
import { useRecoilValue } from 'recoil';

import { botProjectsSpaceState, designPageLocationState, pluginsState } from '../recoilModel';

import { bottomLinks, topLinks } from './pageLinks';
import routerCache from './routerCache';
import { projectIdCache } from './projectCache';

export const useLocation = () => {
  const { location, navigate } = globalHistory;
  const [state, setState] = useState({ location, navigate });

  useEffect(() => globalHistory.listen(({ location }) => setState((state) => ({ ...state, location }))), []);

  return state;
};

export const useLinks = () => {
  const botProjects = useRecoilValue(botProjectsSpaceState);
  // TODO: Refactor to support multi bot. Currently, always set to root bot's projectID
  const rootBotProjectId = botProjects[0];
  const designPageLocation = useRecoilValue(designPageLocationState(rootBotProjectId));
  const openedDialogId: string = designPageLocation.dialogId || 'Main';
  const plugins = useRecoilValue(pluginsState);

  // add page-contributing plugins
  const pluginPages = plugins.reduce((pages, p) => {
    const pageConfig = p.contributes?.views?.page;
    if (pageConfig) {
      pages.push({ ...pageConfig, id: p.id });
    }
    return pages;
  }, [] as any[]);

  return { topLinks: topLinks(rootBotProjectId, openedDialogId, pluginPages), bottomLinks };
};

export const useRouterCache = (to: string) => {
  const [state, setState] = useState(routerCache.getAll());
  const { topLinks, bottomLinks } = useLinks();
  const linksRef = useRef(topLinks.concat(bottomLinks));
  linksRef.current = topLinks.concat(bottomLinks);
  useEffect(() => {
    globalHistory.listen(({ location }) => {
      const links = linksRef.current;
      const { href, origin } = location;
      const uri = replace(href, origin, '');
      const target = find(links, (link) => uri.startsWith(link.to));
      if (target) {
        routerCache.set(target.to, uri);
        setState(routerCache.getAll());
      }
    });
  }, []);

  return state[to] || to;
};

export const useProjectIdCache = () => {
  const [projectId, setProjectId] = useState(projectIdCache.get());
  useEffect(() => {
    setProjectId(projectIdCache.get());
  }, []);

  return projectId;
};
