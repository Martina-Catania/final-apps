import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";
import { AppButton } from "./button";

type PickerMode = "date" | "time";

const useDateTimePicker = (initialDate = new Date()) => {
  const [value, setValue] = useState(initialDate);
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<PickerMode>("date");

  const openDatePicker = () => {
    setMode("date");
    setIsVisible(true);
  };

  const openTimePicker = () => {
    setMode("time");
    setIsVisible(true);
  };

  const closePicker = () => {
    setIsVisible(false);
  };

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setIsVisible(false);
    }

    if (event.type === "dismissed") {
      return;
    }

    if (selectedDate) {
      setValue(selectedDate);
    }
  };

  const formattedDate = useMemo(() => {
    return value.toLocaleDateString();
  }, [value]);

  const formattedTime = useMemo(() => {
    return value.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [value]);

  return {
    mode,
    value,
    isVisible,
    formattedDate,
    formattedTime,
    onChange,
    openDatePicker,
    openTimePicker,
    closePicker,
    setValue,
  };
};

type DateTimeFieldProps = {
  label?: string;
  value?: Date;
  onValueChange?: (next: Date) => void;
};

export const DateTimeField = ({
  label = "Date and time",
  value,
  onValueChange,
}: DateTimeFieldProps) => {
  const picker = useDateTimePicker(value ?? new Date());
  const { colors, iconSizes, spacing, typography } = useThemeTokens();

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    picker.onChange(event, selectedDate);

    if (event.type !== "dismissed" && selectedDate) {
      onValueChange?.(selectedDate);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          gap: spacing.md,
          padding: spacing.md,
        },
      ]}
    >
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.secondary.lg,
          fontWeight: typography.weights.semibold,
        }}
      >
        {label}
      </Text>

      <View style={[styles.valueRow, { gap: spacing.sm }]}>
        <Ionicons color={colors.primary} name="calendar-outline" size={iconSizes.md} />
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.secondary.md,
          }}
        >
          {picker.formattedDate}
        </Text>
      </View>

      <View style={[styles.valueRow, { gap: spacing.sm }]}>
        <Ionicons color={colors.secondary} name="time-outline" size={iconSizes.md} />
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.secondary.md,
          }}
        >
          {picker.formattedTime}
        </Text>
      </View>

      <View style={[styles.actions, { gap: spacing.sm }]}>
        <AppButton label="Pick date" onPress={picker.openDatePicker} variant="secondary" />
        <AppButton label="Pick time" onPress={picker.openTimePicker} variant="default" />
      </View>

      {picker.isVisible ? (
        Platform.OS === "ios" ? (
          <View style={[styles.inlinePicker, { borderColor: colors.border }]}> 
            <DateTimePicker
              display="spinner"
              mode={picker.mode}
              onChange={handleChange}
              value={value ?? picker.value}
            />
            <AppButton label="Done" onPress={picker.closePicker} variant="primary" />
          </View>
        ) : (
          <DateTimePicker
            mode={picker.mode}
            onChange={handleChange}
            value={value ?? picker.value}
          />
        )
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
  },
  valueRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  inlinePicker: {
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 8,
  },
});
