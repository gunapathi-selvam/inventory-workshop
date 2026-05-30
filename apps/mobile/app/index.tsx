/** Entry route — the AuthGate handles real redirects; this lands authenticated
 *  users on the dashboard. */
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/dashboard" />;
}
