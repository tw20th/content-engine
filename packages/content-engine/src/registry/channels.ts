//packages/content-engine/src/registry/channels.ts
import type { Channel, ChannelId } from '../types';

const channels = new Map<ChannelId, Channel>();

export const registerChannel = (channel: Channel): void => {
  channels.set(channel.channelId, channel);
};

export const getChannel = (channelId: ChannelId): Channel => {
  const c = channels.get(channelId);
  if (!c) {
    const available = [...channels.keys()].join(', ');
    throw new Error(`Channel not found: "${channelId}". Available: ${available || '(none)'}`);
  }
  return c;
};

export const listChannels = (): ChannelId[] => {
  return [...channels.keys()];
};
