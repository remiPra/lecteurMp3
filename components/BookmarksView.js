import React, { useContext, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MusicContext } from "../MusicContext";

export default function BookmarksView() {
  const { bookmarks, setBookmarks, sound } = useContext(MusicContext);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // ➕ Ajouter un signet
  async function addBookmark() {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if (!st.isLoaded) return;

    const newBm = {
      id: Date.now(),
      label: newLabel || `Signet ${Math.floor(st.positionMillis / 1000)}s`,
      position: st.positionMillis,
      createdAt: new Date().toISOString(),
    };

    setBookmarks([...bookmarks, newBm]);
    setNewLabel("");
  }

  // ▶️ Aller à un signet
  async function goToBookmark(bm) {
    if (sound) await sound.setPositionAsync(bm.position);
  }

  // 🗑️ Supprimer un signet
  function removeBookmark(id) {
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  }

  // ✏️ Commencer l’édition
  function startEditing(bm) {
    setEditingId(bm.id);
    setEditValue(bm.label);
  }

  // 💾 Valider la modification
  function saveEdit() {
    if (!editValue.trim()) return;
    const updated = bookmarks.map((b) =>
      b.id === editingId ? { ...b, label: editValue } : b
    );
    setBookmarks(updated);
    setEditingId(null);
    setEditValue("");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Signets du morceau</Text>

      {/* Création de signet */}
      <View style={styles.newRow}>
        <TextInput
          placeholder="Commentaire (solo, intro...)"
          placeholderTextColor="#888"
          value={newLabel}
          onChangeText={setNewLabel}
          style={styles.input}
        />
        <TouchableOpacity onPress={addBookmark} style={styles.newBtn}>
          <Text style={{ color: "#000", fontWeight: "700" }}>Créer</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des signets */}
      {bookmarks.length > 0 ? (
        bookmarks.map((bm) => (
          <View key={bm.id} style={styles.row}>
            {/* Si on édite ce signet */}
            {editingId === bm.id ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  autoFocus
                />
                <TouchableOpacity onPress={saveEdit} style={styles.okBtn}>
                  <Text style={{ color: "#000", fontWeight: "700" }}>OK</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={() => goToBookmark(bm)}>
                  <Text style={{ color: "#FFD700", fontWeight: "600" }}>
                    ▶ {bm.label} ({Math.floor(bm.position / 1000)}s)
                  </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity onPress={() => startEditing(bm)}>
                    <Text style={{ color: "#FFD700" }}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeBookmark(bm.id)}>
                    <Text style={{ color: "#ff6666" }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ))
      ) : (
        <Text style={{ color: "#888", marginTop: 10 }}>Aucun signet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  title: { color: "#FFD700", fontSize: 22, fontWeight: "700", marginBottom: 20 },
  newRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
    width: 220,
  },
  newBtn: {
    backgroundColor: "#FFD700",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 8,
    width: 320,
    marginVertical: 4,
  },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editInput: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
    width: 200,
  },
  okBtn: {
    backgroundColor: "#FFD700",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
