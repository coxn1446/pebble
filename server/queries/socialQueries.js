const follow = `
  INSERT INTO follows (follower_id, followed_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

const unfollow = `
  DELETE FROM follows
  WHERE follower_id = $1 AND followed_id = $2
`;

const isFollowing = `
  SELECT 1 FROM follows
  WHERE follower_id = $1 AND followed_id = $2
  LIMIT 1
`;

const block = `
  INSERT INTO user_blocks (blocker_id, blocked_id)
  VALUES ($1, $2)
  ON CONFLICT DO NOTHING
`;

const unblock = `
  DELETE FROM user_blocks
  WHERE blocker_id = $1 AND blocked_id = $2
`;

const isBlockedEitherWay = `
  SELECT 1 FROM user_blocks
  WHERE (blocker_id = $1 AND blocked_id = $2)
     OR (blocker_id = $2 AND blocked_id = $1)
  LIMIT 1
`;

const removeFollowsBothWays = `
  DELETE FROM follows
  WHERE (follower_id = $1 AND followed_id = $2)
     OR (follower_id = $2 AND followed_id = $1)
`;

const blockedUserIds = `
  SELECT blocked_id AS user_id FROM user_blocks WHERE blocker_id = $1
  UNION
  SELECT blocker_id AS user_id FROM user_blocks WHERE blocked_id = $1
`;

module.exports = {
  follow,
  unfollow,
  isFollowing,
  block,
  unblock,
  isBlockedEitherWay,
  removeFollowsBothWays,
  blockedUserIds,
};
