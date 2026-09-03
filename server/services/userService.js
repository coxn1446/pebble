const { isDbHealthy, query } = require('../db');
const { userQueries, socialQueries, organizationQueries } = require('../queries');

const requireDb = () => {
  if (!isDbHealthy()) {
    const err = new Error('Database is unavailable');
    err.status = 503;
    throw err;
  }
};

const withFollowCounts = async (user) => {
  const [followers, following] = await Promise.all([
    query(userQueries.followerCount, [user.user_id]),
    query(userQueries.followingCount, [user.user_id]),
  ]);
  return {
    ...user,
    follower_count: followers.rows[0]?.count ?? 0,
    following_count: following.rows[0]?.count ?? 0,
  };
};

const getMe = async (userId) => {
  requireDb();
  const { rows } = await query(userQueries.findById, [userId]);
  if (!rows[0]) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const user = rows[0];
  let employer = null;
  let organization = null;
  if (user.employer_org_id) {
    const org = await query(organizationQueries.findById, [user.employer_org_id]);
    employer = org.rows[0] || null;
  }
  if (user.organization_id) {
    const org = await query(organizationQueries.findById, [user.organization_id]);
    organization = org.rows[0] || null;
  }
  return withFollowCounts({ ...user, employer, organization });
};

const getByUsername = async (username, viewerId = null) => {
  requireDb();
  const { rows } = await query(userQueries.findByUsername, [username]);
  const user = rows[0];
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (viewerId) {
    const blocked = await query(socialQueries.isBlockedEitherWay, [viewerId, user.user_id]);
    if (blocked.rows[0]) {
      const err = new Error('User not available');
      err.status = 404;
      throw err;
    }
  }

  let isFollowing = false;
  if (viewerId && viewerId !== user.user_id) {
    const follow = await query(socialQueries.isFollowing, [viewerId, user.user_id]);
    isFollowing = Boolean(follow.rows[0]);
  }

  let employer = null;
  if (user.employer_org_id) {
    const org = await query(organizationQueries.findById, [user.employer_org_id]);
    employer = org.rows[0] || null;
  }

  return withFollowCounts({ ...user, employer, is_following: isFollowing });
};

const updateMe = async (userId, data) => {
  requireDb();
  const hasEmployer = Object.prototype.hasOwnProperty.call(data, 'employerOrgId');
  const clearEmployer = hasEmployer && data.employerOrgId === null;
  const hasProfilePic = Object.prototype.hasOwnProperty.call(data, 'profilePicUrl');
  const clearProfilePic = hasProfilePic && data.profilePicUrl === null;
  try {
    if (clearEmployer) {
      await query(userQueries.clearEmployer, [userId]);
    }
    if (clearProfilePic) {
      await query(userQueries.clearProfilePic, [userId]);
    }
    const { rows } = await query(userQueries.updateProfile, [
      userId,
      data.displayName ?? null,
      data.username ?? null,
      data.profession ?? null,
      data.fieldOfStudy ?? null,
      clearEmployer ? null : (hasEmployer ? data.employerOrgId : null),
      data.placeId ?? null,
      data.placeName ?? null,
      data.placeLat ?? null,
      data.placeLng ?? null,
      data.placeLocality ?? null,
      data.placeAdminArea ?? null,
      data.placeCountry ?? null,
      typeof data.contentSearchable === 'boolean' ? data.contentSearchable : null,
      clearProfilePic ? null : (hasProfilePic ? data.profilePicUrl : null),
    ]);
    if (!rows[0]) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return getMe(userId);
  } catch (err) {
    if (err.code === '23505') {
      const e = new Error('Username already in use');
      e.status = 409;
      throw e;
    }
    throw err;
  }
};

const listFollowers = async (username, viewerId = null) => {
  requireDb();
  const profile = await getByUsername(username, viewerId);
  const { rows } = await query(userQueries.listFollowers, [profile.user_id, viewerId]);
  return rows;
};

const listFollowing = async (username, viewerId = null) => {
  requireDb();
  const profile = await getByUsername(username, viewerId);
  const { rows } = await query(userQueries.listFollowing, [profile.user_id, viewerId]);
  return rows;
};

const listForMap = async (viewerId = null, filters = {}) => {
  requireDb();
  const { rows } = await query(userQueries.mapPins, [viewerId]);
  const q = filters.q != null ? String(filters.q).trim().toLowerCase() : '';
  const author = filters.author != null ? String(filters.author).trim().toLowerCase() : '';
  const region = filters.region != null ? String(filters.region).trim().toLowerCase() : '';
  return rows.filter((user) => {
    if (author) {
      const name = `${user.username || ''} ${user.display_name || ''}`.toLowerCase();
      if (!name.includes(author)) return false;
    }
    if (region) {
      const place = [
        user.place_locality,
        user.place_admin_area,
        user.place_country,
        user.place_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!place.includes(region)) return false;
    }
    if (q) {
      const haystack = [
        user.username,
        user.display_name,
        user.field_of_study,
        user.place_name,
        user.place_locality,
        user.place_admin_area,
        user.place_country,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
};

module.exports = {
  getMe,
  getByUsername,
  updateMe,
  listFollowers,
  listFollowing,
  listForMap,
};
