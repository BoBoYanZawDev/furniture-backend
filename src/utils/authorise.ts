// authorise(true | false , user.role , "ADMIN" ,"USER);

export const authorise = (
  allow: boolean,
  userRole: string,
  ...roles: string[]
) => {
  const matched = roles.includes(userRole);
  let grant = true;
  if (allow && !matched) {
    grant = false;
  }

  if (!allow && matched) {
    grant = false;
  }

  return grant;
};
