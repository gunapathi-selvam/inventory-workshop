/** Login screen — credential sign-in that exchanges email/password for a bearer
 *  token via the shared auth.login endpoint. */
import * as React from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "~/theme";
import { Button, Card, Icon, Screen, Stack, Text, TextField } from "~/components";
import { useAuth } from "~/api/auth";
import { toErrorMessage } from "~/lib/errors";

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      setError(toErrorMessage(e, "Invalid credentials"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center", padding: theme.layoutSpacing.page, paddingTop: insets.top }}
      >
        <Stack gap="xl">
          <Stack gap="sm" align="center">
            <View
              style={{
                width: theme.sizing.avatarSize.lg,
                height: theme.sizing.avatarSize.lg,
                borderRadius: theme.radii.lg,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="cube" size="xl" color="primaryForeground" />
            </View>
            <Text variant="title">Workshop</Text>
            <Text variant="body" color="mutedForeground" align="center">
              Sign in to manage orders, inventory and customers.
            </Text>
          </Stack>

          <Card>
            <Stack gap="lg">
              <TextField
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@workshop.local"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <TextField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                onSubmitEditing={onSubmit}
              />
              {error ? (
                <Text variant="caption" color="danger">
                  {error}
                </Text>
              ) : null}
              <Button
                label="Sign in"
                onPress={onSubmit}
                loading={submitting}
                disabled={!email || !password}
                fullWidth
                size="lg"
              />
            </Stack>
          </Card>

          <Text variant="caption" color="mutedForeground" align="center">
            Demo: admin@workshop.local / admin123
          </Text>
        </Stack>
      </KeyboardAvoidingView>
    </Screen>
  );
}
