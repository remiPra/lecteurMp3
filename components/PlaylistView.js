import React, { useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MusicContext } from "../MusicContext";
     import { Audio } from "expo-av"; // 🔹 n’oublie cette ligne en haut du fichier !


export default function PlaylistView() {
  const {
    allPlaylists, setAllPlaylists,
    currentPlaylistName, setCurrentPlaylistName,
    currentFile, setCurrentFile,
    setIsPlaying, sound, setSound
  } = useContext(MusicContext);

  const [newPlaylistName, setNewPlaylistName] = React.useState("");

  // ➕ Créer une nouvelle playlist
  function createPlaylist() {
    const name = newPlaylistName.trim();
    if (!name || allPlaylists[name]) return;
    setAllPlaylists({ ...allPlaylists, [name]: [] });
    setCurrentPlaylistName(name);
    setNewPlaylistName("");
  }

  // ▶️ Lire un morceau depuis une playlist
  async function playTrack(trackPath) {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

const { sound: newSound } = await Audio.Sound.createAsync(
  { uri: trackPath },
  {},
  (status) => {
    if (status.isLoaded) setIsPlaying(status.isPlaying);
  }
);

      setSound(newSound);
      await newSound.playAsync();
      setCurrentFile(trackPath);
      setIsPlaying(true);
    } catch (e) {
      console.error("Erreur lecture piste :", e);
    }
  }

  // 🗑️ Supprimer un morceau
  function removeTrack(trackId) {
    setAllPlaylists((prev) => ({
      ...prev,
      [currentPlaylistName]: prev[currentPlaylistName].filter((t) => t.id !== trackId),
    }));
  }

  const currentPlaylist = allPlaylists[currentPlaylistName] || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Mes Playlists</Text>

      {/* Créer une playlist */}
      <View style={styles.newRow}>
        <TextInput
          placeholder="Nouvelle playlist…"
          placeholderTextColor="#999"
          value={newPlaylistName}
          onChangeText={setNewPlaylistName}
          style={styles.input}
        />
        <TouchableOpacity onPress={createPlaylist} style={styles.newBtn}>
          <Text style={{ color: "#000", fontWeight: "700" }}>Créer</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des playlists */}
      <View style={styles.playlistList}>
        {Object.keys(allPlaylists).map((name) => (
          <TouchableOpacity
            key={name}
            style={[
              styles.playlistItem,
              currentPlaylistName === name && styles.activePlaylist,
            ]}
            onPress={() => setCurrentPlaylistName(name)}
          >
            <Text
              style={{
                color: currentPlaylistName === name ? "#000" : "#FFD700",
                fontWeight: "700",
              }}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subtitle}>
        🎧 Playlist actuelle : <Text style={{ color: "#FFD700" }}>{currentPlaylistName}</Text>
      </Text>

      {/* Morceaux de la playlist */}
      {currentPlaylist.length > 0 ? (
        currentPlaylist.map((track) => (
          <View key={track.id} style={styles.trackRow}>
            <TouchableOpacity onPress={() => playTrack(track.path)}>
              <Text
                style={{
                  color: currentFile === track.path ? "#FFD700" : "#fff",
                  fontWeight: currentFile === track.path ? "700" : "500",
                }}
              >
                {currentFile === track.path ? "▶ " : "• "}
                {track.name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeTrack(track.id)}>
              <Text style={{ color: "#ff6666" }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={{ color: "#888", marginTop: 12 }}>
          Aucune piste dans cette playlist
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  title: { color: "#FFD700", fontSize: 22, fontWeight: "700", marginBottom: 20 },
  newRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  newBtn: {
    backgroundColor: "#FFD700",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  playlistList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  playlistItem: {
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  activePlaylist: { backgroundColor: "#FFD700" },
  subtitle: { color: "#fff", fontSize: 16, marginTop: 10, marginBottom: 6 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 8,
    width: 320,
  },
});
