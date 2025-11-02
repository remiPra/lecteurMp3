import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import Slider from "@react-native-community/slider";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const [seekInterval, setSeekInterval] = useState(null);
  const [playlist, setPlaylist] = useState([]);

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFile, setCurrentFile] = useState("assets/song.mp3");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);

  // 🔁 Charger la playlist au démarrage
  useEffect(() => {
    (async () => {
      const savedPlaylist = await AsyncStorage.getItem("playlist");
      if (savedPlaylist) {
        setPlaylist(JSON.parse(savedPlaylist));
      }
    })();
  }, []);

  // 💾 Sauvegarder la playlist à chaque modification
  useEffect(() => {
    AsyncStorage.setItem("playlist", JSON.stringify(playlist));
  }, [playlist]);

  // 🔊 Configuration iOS / Android
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

  // 📂 Choisir et jouer un fichier audio + l’ajouter à la playlist
  async function pickAudioFile() {
    try {
      if (Platform.OS === "web") {
        document.getElementById("fileInput").click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
      });

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const filename = result.assets[0].name || "temp.mp3";
        const newPath = FileSystem.documentDirectory + filename;

        await FileSystem.copyAsync({ from: uri, to: newPath });

        if (sound) {
          await sound.unloadAsync();
          setSound(null);
        }

        // Lecture immédiate
        setCurrentFile(newPath);
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: newPath },
          {},
          updatePlaybackStatus
        );
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);

        // 🎶 Ajout dans la playlist locale
        const newTrack = {
          id: Date.now(),
          name: filename,
          path: newPath,
          addedAt: new Date().toISOString(),
        };

        setPlaylist((prev) => {
          const exists = prev.some((p) => p.path === newPath);
          return exists ? prev : [...prev, newTrack];
        });
      }
    } catch (error) {
      console.error("Erreur sélection fichier :", error);
    }
  }

  // ▶️ Lecture / pause
  async function playPauseSound() {
    try {
      if (Platform.OS === "web") {
        const audioEl = document.getElementById("player");
        if (audioEl.paused) {
          audioEl.play();
          setIsPlaying(true);
        } else {
          audioEl.pause();
          setIsPlaying(false);
        }
        return;
      }

      if (!sound) {
        const { sound } = await Audio.Sound.createAsync(
          currentFile.startsWith("assets/")
            ? require("./assets/song.mp3")
            : { uri: currentFile },
          {},
          updatePlaybackStatus
        );
        setSound(sound);
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Erreur audio :", error);
    }
  }

  // 🕹️ Met à jour la position et la durée
  function updatePlaybackStatus(status) {
    if (status.isLoaded && !isSeeking) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 1);
      setIsPlaying(status.isPlaying);
    }
  }

  // ⏩ / ⏪ commandes rapides
  async function skipForward() {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      const newPos = Math.min(status.positionMillis + 30000, status.durationMillis);
      await sound.setPositionAsync(newPos);
    }
  }

  async function skipBackward() {
    if (!sound) return;
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      const newPos = Math.max(status.positionMillis - 30000, 0);
      await sound.setPositionAsync(newPos);
    }
  }

  // 🔁 Avance / retour continus
  async function startFastForward() {
    if (!sound) return;
    const id = setInterval(async () => {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPos = Math.min(status.positionMillis + 1000, status.durationMillis);
        await sound.setPositionAsync(newPos);
      }
    }, 100);
    setSeekInterval(id);
  }

  function stopFastForward() {
    if (seekInterval) {
      clearInterval(seekInterval);
      setSeekInterval(null);
    }
  }

  async function startFastRewind() {
    if (!sound) return;
    const id = setInterval(async () => {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPos = Math.max(status.positionMillis - 1000, 0);
        await sound.setPositionAsync(newPos);
      }
    }, 100);
    setSeekInterval(id);
  }

  function stopFastRewind() {
    if (seekInterval) {
      clearInterval(seekInterval);
      setSeekInterval(null);
    }
  }

  // 🎧 Nettoyage
  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  // ⏱️ Format du temps
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  // 🧱 Rendu UI
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎶 Mon Lecteur Universel 🎶</Text>

      {/* Slider de progression */}
      <View style={styles.sliderContainer}>
        <Slider
          style={{ width: 300, height: 40 }}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingStart={() => setIsSeeking(true)}
          onSlidingComplete={async (value) => {
            setIsSeeking(false);
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
      </View>

      {/* Contrôles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.smallButton}
          onPressIn={startFastRewind}
          onPressOut={stopFastRewind}
        >
          <Text style={styles.buttonText}>◀️</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallButton} onPress={skipBackward}>
          <Text style={styles.buttonText}>⏪ -30s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isPlaying && styles.buttonActive]}
          onPress={playPauseSound}
        >
          <Text style={styles.buttonText}>
            {isPlaying ? "⏸️ Pause" : "▶️ Jouer"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallButton} onPress={skipForward}>
          <Text style={styles.buttonText}>+30s ⏩</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPressIn={startFastForward}
          onPressOut={stopFastForward}
        >
          <Text style={styles.buttonText}>▶️</Text>
        </TouchableOpacity>
      </View>

      {/* Bouton pour choisir un fichier */}
      <TouchableOpacity style={styles.folderButton} onPress={pickAudioFile}>
        <Text style={styles.buttonText}>📂 Choisir un morceau</Text>
      </TouchableOpacity>

      {/* Playlist affichée séparément */}
      <View style={{ marginTop: 30 }}>
        <Text style={{ color: "#FFD700", fontWeight: "600", fontSize: 18 }}>
          🎵 Ma Playlist
        </Text>
        {playlist.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={{ marginVertical: 6 }}
            onPress={async () => {
              if (sound) await sound.unloadAsync();
              const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: track.path },
                {},
                updatePlaybackStatus
              );
              setSound(newSound);
              await newSound.playAsync();
              setIsPlaying(true);
              setCurrentFile(track.path);
            }}
          >
            <Text style={{ color: "#fff" }}>• {track.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {Platform.OS === "web" && (
        <>
          <input
            type="file"
            id="fileInput"
            accept="audio/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                const audioEl = document.getElementById("player");
                audioEl.src = url;
                audioEl.play();
                setIsPlaying(true);
              }
            }}
          />
          <audio id="player" style={{ display: "none" }} controls />
        </>
      )}

      <Text style={styles.credit}>Créé par Rémi 🎧</Text>
    </View>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0c0c0c",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFD700",
    marginBottom: 20,
  },
  sliderContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 300,
  },
  timeText: {
    color: "#ccc",
    fontSize: 14,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "90%",
  },
  button: {
    backgroundColor: "#222",
    borderRadius: 60,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: "#FFD700",
    marginHorizontal: 15,
  },
  smallButton: {
    backgroundColor: "#333",
    borderRadius: 40,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  folderButton: {
    marginTop: 40,
    backgroundColor: "#444",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  buttonActive: {
    backgroundColor: "#FFD700",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  credit: {
    color: "#888",
    position: "absolute",
    bottom: 30,
    fontSize: 14,
  },
});
