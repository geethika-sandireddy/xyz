import { useAuth } from "./auth-context";

// used to just be a random id stored in the browser. now it's your real
// account id once you're logged in, empty string if you're not.
// kept the same return type (just a string) so every page that already
// calls useSession() didn't need to change.
export function useSession() {
  const { user } = useAuth();
  return user?.id ?? "";
}
