import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const MusicContext = createContext();

export function MusicProvider({ children }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [allPlaylists, setAllPlaylists] = useState({ Favoris: [] });
  const [currentPlaylistName, setCurrentPlaylistName] = useState("Favoris");
  const [bookmarks, setBookmarks] = useState([]);

  // 🟡 Charger les données au démarrage
  useEffect(() => {
    (async () => {
      try {
        const savedPlaylists = await AsyncStorage.getItem("allPlaylists");
        const savedBookmarks = await AsyncStorage.getItem("bookmarks");
        const savedCurrentFile = await AsyncStorage.getItem("currentFile");
        const savedCurrentPlaylist = await AsyncStorage.getItem("currentPlaylistName");

        if (savedPlaylists) setAllPlaylists(JSON.parse(savedPlaylists));
        if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
        if (savedCurrentFile) setCurrentFile(savedCurrentFile);
        if (savedCurrentPlaylist) setCurrentPlaylistName(savedCurrentPlaylist);
      } catch (e) {
        console.error("Erreur lors du chargement des données :", e);
      }
    })();
  }, []);

  // 💾 Sauvegarder les playlists quand elles changent
  useEffect(() => {
    AsyncStorage.setItem("allPlaylists", JSON.stringify(allPlaylists));
  }, [allPlaylists]);

  // 💾 Sauvegarder les signets quand ils changent
  useEffect(() => {
    AsyncStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // 💾 Sauvegarder la piste actuelle
  useEffect(() => {
    if (currentFile) AsyncStorage.setItem("currentFile", currentFile);
  }, [currentFile]);

  // 💾 Sauvegarder la playlist sélectionnée
  useEffect(() => {
    AsyncStorage.setItem("currentPlaylistName", currentPlaylistName);
  }, [currentPlaylistName]);

  return (
    <MusicContext.Provider
      value={{
        sound, setSound,
        isPlaying, setIsPlaying,
        currentFile, setCurrentFile,
        currentTrackId, setCurrentTrackId,
        position, setPosition,
        duration, setDuration,
        allPlaylists, setAllPlaylists,
        currentPlaylistName, setCurrentPlaylistName,
        bookmarks, setBookmarks,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}
    