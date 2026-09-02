/**
 * Screens reachable via a direct deep link (e.g. typing yoursite.com/admin
 * into a browser) can end up with an empty or single-entry navigation
 * stack — there's nothing to go "back" to. Plain navigation.goBack() in
 * that situation silently does nothing, which is exactly what made the
 * admin back buttons look broken. This checks first and falls back to a
 * known screen instead of a no-op.
 */
export function goBackOrTo(navigation: any, fallbackScreen: string, fallbackParams?: any) {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    navigation.navigate(fallbackScreen, fallbackParams);
  }
}
