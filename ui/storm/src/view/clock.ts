import config from '../config';
import StormCtrl from '../ctrl';
import { defined } from 'common';
import { getNow } from '../util';
import { h } from 'snabbdom';
import { VNode } from 'snabbdom/vnode';

let refreshInterval: Timeout;

export default function renderClock(ctrl: StormCtrl): VNode {
  const malus = ctrl.vm.modifier.malus;
  return h('div.storm__clock', [
    h('div.storm__clock__time', {
      hook: {
        insert(node) {
          const el = node.elm as HTMLDivElement;
          refreshInterval = setInterval(() => renderIn(ctrl, el), 100);
        },
        destroy() {
          if (refreshInterval) clearInterval(refreshInterval);
        }
      }
    }, formatMs(ctrl.vm.clock.budget)),
    !!malus && malus.at > getNow() - 900 ? h('div.storm__clock__malus', '-' + malus.seconds) : null
  ]);
}

function renderIn(ctrl: StormCtrl, el: HTMLElement) {
  const clock = ctrl.vm.clock;
  if (!clock.startAt) return;
  const now = getNow();
  const millis = clock.startAt + clock.budget - getNow();
  const malus = ctrl.vm.modifier.malus;
  const millisSinceMalus: number | undefined = malus && (now - malus.at < 1000 ? now - malus.at : undefined);
  const showExtra = defined(millisSinceMalus) ?
    config.clock.malus * (1 - millisSinceMalus / 1000) * 1000 :
    0;
  el.innerText = formatMs(millis + showExtra);
  if (millis < 1 && ctrl.vm.mode == 'play') ctrl.end();
}

const pad = (x: number): string => (x < 10 ? '0' : '') + x;

const formatMs = (millis: number): string => {
  const date = new Date(Math.max(0, millis + 500)),
    minutes = date.getUTCMinutes(),
    seconds = date.getUTCSeconds();
  return minutes + ':' + pad(seconds);
}