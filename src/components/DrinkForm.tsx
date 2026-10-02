import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { useForm, type FormErrors } from "../hooks/useForm";
import type { Category, Drink, DrinkInput } from "../types/drink";
import CategoryChips, { type ChipOption } from "./CategoryChips";
import FormField from "./FormField";
import PrimaryButton from "./PrimaryButton";

interface DrinkFormValues {
  name: string;
  price: string;
  category: Category;
  available: boolean;
}

interface DrinkFormProps {
  visible: boolean;
  drink: Drink | null;
  onSubmit: (input: DrinkInput) => Promise<void>;
  onClose: () => void;
}

const categoryOptions: ChipOption<Category>[] = [
  { value: "hot", label: "Hot" },
  { value: "cold", label: "Cold" },
];

function validate(
  values: DrinkFormValues
): FormErrors<DrinkFormValues> {
  const errors: FormErrors<DrinkFormValues> = {};

  if (values.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  const price = Number(values.price);

  if (!Number.isFinite(price) || price <= 0) {
    errors.price = "Enter a price greater than zero.";
  }

  return errors;
}

export default function DrinkForm({
  visible,
  drink,
  onSubmit,
  onClose,
}: DrinkFormProps) {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const { values, errors, setField, validateAll, reset } =
    useForm<DrinkFormValues>(
      {
        name: "",
        price: "",
        category: "hot",
        available: true,
      },
      validate
    );

  const isEditing = drink !== null;

  useEffect(() => {
    if (!visible) return;

    reset(
      drink
        ? {
            name: drink.name,
            price: String(drink.price),
            category: drink.category,
            available: drink.available,
          }
        : {
            name: "",
            price: "",
            category: "hot",
            available: true,
          }
    );

    setServerError("");
  }, [visible, drink, reset]);

  async function handleSave() {
    if (!validateAll()) return;

    setSaving(true);
    setServerError("");

    const input: DrinkInput = {
      name: values.name.trim(),
      price: Number(values.price),
      category: values.category,
      available: values.available,
    };

    try {
      await onSubmit(input);
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Could not save the drink."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          <Text style={styles.title}>
            {isEditing ? "Edit drink" : "Add drink"}
          </Text>

          <FormField
            label="Name"
            value={values.name}
            onChangeText={(text) => setField("name", text)}
            placeholder="e.g. Cappuccino"
            error={errors.name}
          />

          <FormField
            label="Price"
            value={values.price}
            onChangeText={(text) => setField("price", text)}
            placeholder="e.g. 9.50"
            keyboardType="decimal-pad"
            error={errors.price}
          />

          <Text style={styles.fieldLabel}>Category</Text>

          <CategoryChips
            options={categoryOptions}
            selected={values.category}
            onSelect={(value) => setField("category", value)}
          />

          <View style={styles.availableRow}>
            <Text style={styles.fieldLabel}>Available</Text>

            <Switch
              value={values.available}
              onValueChange={(value) =>
                setField("available", value)
              }
            />
          </View>

          {serverError ? (
            <Text style={styles.serverError}>{serverError}</Text>
          ) : null}

          <View style={styles.buttons}>
            <PrimaryButton
              label="Cancel"
              variant="secondary"
              onPress={onClose}
              disabled={saving}
            />

            <PrimaryButton
              label={isEditing ? "Save changes" : "Add drink"}
              onPress={handleSave}
              loading={saving}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#FFF8F0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#3E2723",
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3E2723",
    marginBottom: 6,
  },
  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  serverError: {
    color: "#B91C1C",
    marginBottom: 12,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
});