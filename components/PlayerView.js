import React, { useContext, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { MusicContext } from "../MusicContext";

export default function PlayerView() {
  const {
    sound, setSound,
    isPlaying, setIsPlaying,
    currentFile, setCurrentFile,
    position, setPosition,
    duration, setDuration,
    allPlaylists, setAllPlaylists,
    currentPlaylistName,
  } = useContext(MusicContext);

  useEffect(() => {
    if (Platform.OS !== "web") {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
    }
  }, []);

  function updatePlaybackStatus(status) {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 1);
      setIsPlaying(status.isPlaying);
    }
  }

  async function playPauseSound() {
    try {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          currentFile ? { uri: currentFile } : require("../assets/song.mp3"),
          {},
          updatePlaybackStatus
        );
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
      } else {
        const st = await sound.getStatusAsync();
        if (st.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.error("Erreur audio :", e);
    }
  }

  async function pickAudioFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const filename = result.assets[0].name || "temp.mp3";
        const newPath = FileSystem.documentDirectory + filename;
        await FileSystem.copyAsync({ from: uri, to: newPath });
        setCurrentFile(newPath);
      }
    } catch (e) {
      console.error("Erreur sélection fichier :", e);
    }
  }

  async function skipForward() {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if (!st.isLoaded) return;
    const newPos = Math.min((st.positionMillis || 0) + 30000, st.durationMillis || 0);
    await sound.setPositionAsync(newPos);
  }

  async function skipBackward() {
    if (!sound) return;
    const st = await sound.getStatusAsync();
    if (!st.isLoaded) return;
    const newPos = Math.max((st.positionMillis || 0) - 30000, 0);
    await sound.setPositionAsync(newPos);
  }

  let seekInterval = null;

  async function startFastForward() {
    if (!sound) return;
    seekInterval = setInterval(async () => {
      const st = await sound.getStatusAsync();
      if (st.isLoaded) {
        const newPos = Math.min((st.positionMillis || 0) + 1000, st.durationMillis || 0);
        await sound.setPositionAsync(newPos);
      }
    }, 100);
  }

  async function startFastRewind() {
    if (!sound) return;
    seekInterval = setInterval(async () => {
      const st = await sound.getStatusAsync();
      if (st.isLoaded) {
        const newPos = Math.max((st.positionMillis || 0) - 1000, 0);
        await sound.setPositionAsync(newPos);
      }
    }, 100);
  }

  function stopFastSeek() {
    if (seekInterval) {
      clearInterval(seekInterval);
      seekInterval = null;
    }
  }

  // 💾 Ajouter à la playlist actuelle
  function addToPlaylist() {
    if (!currentFile) return;

    const filename = currentFile.split("/").pop();
    const newTrack = {
      id: Date.now(),
      name: filename,
      path: currentFile,
      addedAt: new Date().toISOString(),
    };

    setAllPlaylists((prev) => {
      const currentList = prev[currentPlaylistName] || [];
      const exists = currentList.some((t) => t.path === currentFile);
      if (exists) return prev;
      return { ...prev, [currentPlaylistName]: [...currentList, newTrack] };
    });
  }

  const formatTime = (ms) => {
    const total = Math.floor((ms || 0) / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  // 🧾 Extraire le nom du fichier proprement
  const currentFileName = currentFile
    ? decodeURIComponent(currentFile.split("/").pop())
    : "Aucun morceau en cours";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎶 Lecteur Audio 🎶</Text>

      {/* Affichage du nom du morceau */}
      <Text style={styles.trackName}>
        {currentFileName.replace(".mp3", "").replace(".wav", "")}
      </Text>

      {/* Slider */}
      <Slider
        style={{ width: 300, height: 40 }}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={async (value) => {
          if (sound) await sound.setPositionAsync(value);
        }}
        minimumTrackTintColor="#FFD700"
        maximumTrackTintColor="#555"
        thumbTintColor="#FFD700"
      />
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Contrôles complets */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.smallButton}
          onPressIn={startFastRewind}
          onPressOut={stopFastSeek}
        >
          <Text style={styles.buttonText}>⏮️</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallButton} onPress={skipBackward}>
          <Text style={styles.buttonText}>-30s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.buttonActive]}
          onPress={playPauseSound}
        >
          <Text style={styles.buttonText}>{isPlaying ? "⏸️" : "▶️"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallButton} onPress={skipForward}>
          <Text style={styles.buttonText}>+30s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPressIn={startFastForward}
          onPressOut={stopFastSeek}
        >
          <Text style={styles.buttonText}>⏭️</Text>
        </TouchableOpacity>
      </View>

      {/* Boutons de gestion */}
      <TouchableOpacity style={styles.folderButton} onPress={pickAudioFile}>
        <Text style={styles.buttonText}>📂 Choisir un morceau</Text>
      </TouchableOpacity>

      {currentFile && (
        <TouchableOpacity style={styles.saveButton} onPress={addToPlaylist}>
          <Text style={styles.buttonText}>
            💾 Ajouter à la playlist ({currentPlaylistName})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  title: { color: "#FFD700", fontSize: 22, fontWeight: "700", marginBottom: 10 },
  trackName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 14,
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "90%",
    marginTop: 10,
  },
  playButton: {
    backgroundColor: "#222",
    borderRadius: 60,
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  smallButton: {
    backgroundColor: "#333",
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  buttonActive: { backgroundColor: "#FFD700" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  folderButton: {
    backgroundColor: "#444",
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFD700",
    marginTop: 20,
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: "#222",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  timeRow: { flexDirection: "row", justifyContent: "space-between", width: 300 },
  timeText: { color: "#ccc", fontSize: 14 },
});
