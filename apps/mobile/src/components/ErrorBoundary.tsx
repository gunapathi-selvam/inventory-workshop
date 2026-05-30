/**
 * ErrorBoundary — catches render-time errors anywhere below it and shows a
 * readable, themed message instead of a blank white screen. Critical for
 * on-device debugging in Expo Go, where an uncaught error otherwise just leaves
 * a white screen with no information.
 */
import * as React from "react";
import { Screen } from "./Screen";
import { Stack } from "./Stack";
import { Text } from "./Text";
import { Button } from "./Button";

/** Themed fallback UI (functional, so it can use the theme hooks). */
function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <Screen scroll>
      <Stack gap="lg">
        <Text variant="title" color="danger">
          Something crashed
        </Text>
        <Text variant="body" color="mutedForeground">
          The app hit an error while rendering. Details below — share this if it
          keeps happening.
        </Text>
        <Stack gap="xs">
          <Text variant="label">{error.name}</Text>
          <Text variant="mono" color="danger">
            {error.message}
          </Text>
          {error.stack ? (
            <Text variant="caption" color="mutedForeground">
              {error.stack.split("\n").slice(0, 8).join("\n")}
            </Text>
          ) : null}
        </Stack>
        <Button label="Try again" icon="refresh" onPress={onReset} fullWidth />
      </Stack>
    </Screen>
  );
}

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface to the Metro/dev console too.
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  override render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}
