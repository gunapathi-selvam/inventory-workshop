/** More — profile, appearance (theme), gated navigation to discounts/users,
 *  notifications, and sign out. */
import * as React from "react";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTheme, useThemeContext } from "~/theme";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  Icon,
  Row,
  Screen,
  Stack,
  Text,
  type IoniconName,
} from "~/components";
import { useAuth } from "~/api/auth";
import { useCan } from "~/lib/permissions";
import { titleCase } from "~/lib/format";

function MenuRow({ icon, label, onPress }: { icon: IoniconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        opacity: pressed ? theme.opacity.pressed : theme.opacity.full,
      })}
    >
      <Icon name={icon} size="md" color="mutedForeground" />
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      <Icon name="chevron-forward" size="sm" color="mutedForeground" />
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { preference, setPreference } = useThemeContext();
  const canDiscounts = useCan("discounts.view");
  const canUsers = useCan("users.view");

  return (
    <Screen scroll>
      <Stack gap="section">
        {/* Profile */}
        <Card>
          <Row gap="md">
            <Avatar name={user?.name} size="lg" />
            <Stack gap="xxs" style={{ flex: 1 }}>
              <Text variant="subtitle">{user?.name ?? "—"}</Text>
              <Text variant="caption" color="mutedForeground">
                {user?.email ?? ""}
              </Text>
              {user?.role ? <Badge label={titleCase(user.role)} tone="primary" /> : null}
            </Stack>
          </Row>
        </Card>

        {/* Appearance */}
        <Stack gap="md">
          <Text variant="heading">Appearance</Text>
          <Card>
            <Row gap="sm">
              {(["system", "light", "dark"] as const).map((p) => (
                <Chip key={p} label={titleCase(p)} selected={preference === p} onPress={() => setPreference(p)} />
              ))}
            </Row>
          </Card>
        </Stack>

        {/* Navigation */}
        <Stack gap="md">
          <Text variant="heading">Manage</Text>
          <Card padded>
            <MenuRow icon="notifications-outline" label="Notifications" onPress={() => router.push("/notifications")} />
            {canDiscounts ? (
              <>
                <Divider />
                <MenuRow icon="pricetags-outline" label="Discount codes" onPress={() => router.push("/discounts")} />
              </>
            ) : null}
            {canUsers ? (
              <>
                <Divider />
                <MenuRow icon="person-circle-outline" label="Team members" onPress={() => router.push("/users")} />
              </>
            ) : null}
          </Card>
        </Stack>

        <Button label="Sign out" icon="log-out-outline" variant="danger" onPress={logout} fullWidth />
      </Stack>
    </Screen>
  );
}
