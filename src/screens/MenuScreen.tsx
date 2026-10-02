import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import CategoryChips, { type ChipOption } from "../components/CategoryChips";
import DrinkCard from "../components/DrinkCard";
import DrinkForm from "../components/DrinkForm";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { useDrinks } from "../hooks/useDrinks";
import type { Category, Drink, DrinkInput } from "../types/drink";

type Filter = "all" | Category;

const filterOptions: ChipOption<Filter>[] = [
  { value: "all", label: "All" },
  { value: "hot", label: "Hot" },
  { value: "cold", label: "Cold" },
];

export default function MenuScreen() {
  const { user, signOut } = useAuth();

  const {
    drinks,
    loading,
    refreshing,
    error,
    refresh,
    addDrink,
    editDrink,
    removeDrink,
  } = useDrinks();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Drink | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return drinks.filter((drink) => {
      const matchesFilter =
        filter === "all" || drink.category === filter;

      const matchesQuery =
        !q || drink.name.toLowerCase().includes(q);

      return matchesFilter && matchesQuery;
    });
  }, [drinks, filter, query]);

  const soldOut = useMemo(
    () => drinks.filter((drink) => !drink.available).length,
    [drinks]
  );

  const canDelete = user?.role === "manager";

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(drink: Drink) {
    setEditing(drink);
    setFormOpen(true);
  }

  function confirmDelete(drink: Drink) {
    Alert.alert(
      "Delete drink",
      `Delete ${drink.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeDrink(drink.id);
            } catch (err) {
              Alert.alert(
                "Could not delete",
                err instanceof Error
                  ? err.message
                  : "Please try again."
              );
            }
          },
        },
      ]
    );
  }

  async function handleSubmit(input: DrinkInput) {
    if (editing) {
      await editDrink(editing.id, input);
    } else {
      await addDrink(input);
    }
  }

  async function toggleAvailable(drink: Drink) {
    try {
      await editDrink(drink.id, {
        available: !drink.available,
      });
    } catch (err) {
      Alert.alert(
        "Could not update",
        err instanceof Error
          ? err.message
          : "Please try again."
      );
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#3E2723" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Today's menu</Text>
          <Text style={styles.subtitle}>
            {user?.name} · {user?.role}
          </Text>
        </View>

        <PrimaryButton
          label="Sign out"
          variant="secondary"
          onPress={signOut}
        />
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search drinks..."
        placeholderTextColor="#9E9E9E"
        style={styles.search}
      />

      <CategoryChips
        options={filterOptions}
        selected={filter}
        onSelect={setFilter}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {visible.length} drink{visible.length === 1 ? "" : "s"}
        </Text>

        {soldOut > 0 && (
          <Text style={styles.soldOut}>
            {soldOut} sold out
          </Text>
        )}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>

          <PrimaryButton
            label="Try again"
            onPress={refresh}
            loading={refreshing}
          />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <DrinkCard
              drink={item}
              canDelete={canDelete}
              onEdit={openEdit}
              onDelete={confirmDelete}
              onToggleAvailable={toggleAvailable}
            />
          )}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={refresh}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No drinks match your search.
            </Text>
          }
        />
      )}

      <View style={styles.addButton}>
        <PrimaryButton
          label="+ Add drink"
          onPress={openCreate}
        />
      </View>

      <DrinkForm
        visible={formOpen}
        drink={editing}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8F0",
  },
  loadingText: {
    marginTop: 10,
    color: "#3E2723",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#3E2723",
  },
  subtitle: {
    color: "#9E9E9E",
    marginTop: 3,
  },
  search: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0D6CC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  summaryText: {
    color: "#3E2723",
    fontWeight: "600",
  },
  soldOut: {
    color: "#B91C1C",
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  empty: {
    textAlign: "center",
    color: "#9E9E9E",
    marginTop: 40,
  },
  errorBox: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
  },
  errorText: {
    color: "#B91C1C",
    textAlign: "center",
    marginBottom: 12,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
});