import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import PlayerView from "./components/PlayerView";
import PlaylistView from "./components/PlaylistView";
import BookmarksView from "./components/BookmarksView";
import { MusicProvider } from "./MusicContext";

export default function App() {
  const [currentTab, setCurrentTab] = useState("player");

  return (
    <MusicProvider>
      <View style={styles.container}>
        {/* Contenu principal */}
        <View style={styles.content}>
          {currentTab === "player" && <PlayerView />}
          {currentTab === "playlist" && <PlaylistView />}
          {currentTab === "bookmarks" && <BookmarksView />}
        </View>

        {/* Barre de navigation */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => setCurrentTab("player")} style={styles.navBtn}>
            <Text style={currentTab === "player" ? styles.navTextActive : styles.navText}>🎧 Lecteur</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentTab("playlist")} style={styles.navBtn}>
            <Text style={currentTab === "playlist" ? styles.navTextActive : styles.navText}>🎵 Playlists</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentTab("bookmarks")} style={styles.navBtn}>
            <Text style={currentTab === "bookmarks" ? styles.navTextActive : styles.navText}>📍 Signets</Text>
          </TouchableOpacity>
        </View>
      </View>
    </MusicProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  navbar: {
    flexDirection: "row",
    marginBottom:100,
    justifyContent: "space-around",
    paddingVertical:10,
    borderTopWidth:2, 
    borderColor: "#444",
    backgroundColor: "#111",
  },
  navBtn: { paddingHorizontal: 10 },
  navText: { color: "#888", fontSize: 16 },
  navTextActive: { color: "#FFD700", fontSize: 16, fontWeight: "700" },
});
