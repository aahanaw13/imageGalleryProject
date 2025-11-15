import React, { useState, useEffect } from "react";

export default function App() {
  return <ImageGallery />;
};
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  StyleSheet,
  Text,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const numColumns = 3;
const imageSize = (width - 40) / numColumns;

function ImageGallery() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Request media library permission
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      
      if (mediaPermission.status === 'granted') {
        setHasPermission(true);
        loadImages();
      } else {
        Alert.alert(
          'Permission Required',
          'Please grant media library access to view your photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => requestPermissions() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 100,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });
      setImages(media.assets);
    } catch (error) {
      console.error('Error loading images:', error);
      Alert.alert('Error', 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const openImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await saveImageToGallery(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await saveImageToGallery(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
    }
  };
  const saveImageToGallery = async (imageUri) => {
    try {
      // Request permission to save to media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to save to media library is required!');
        return;
      }

      // Save the image to the device's media library
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      
      // Optionally create or get an album
      const album = await MediaLibrary.getAlbumAsync('Image Gallery App');
      
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Image Gallery App', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Success', 'Image saved to gallery!');
      
      // Reload images to show the new one
      await loadImages();
    } catch (error) {
       console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image to gallery');
    }
  };
  const openImage = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const showActionSheet = () => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImagePicker },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderImage = ({ item }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => openImage(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.image}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  if (!hasPermission) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.permissionText}>
              Media library permission is required to display photos
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading photos...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Gallery</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={showActionSheet}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Image Grid */}
        {images.length > 0 ? (
          <FlatList
            data={images}
            renderItem={renderImage}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No photos found</Text>
            <TouchableOpacity style={styles.addPhotoButton} onPress={showActionSheet}>
              <Text style={styles.addPhotoButtonText}>Add Photos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Full Screen Image Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackground}
              onPress={closeModal}
              activeOpacity={1}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
                
                {selectedImage && (
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 5,
  },
  grid: {
    padding: 10,
  },
  imageContainer: {
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    backgroundColor: '#fff',
  },
  image: {
    width: imageSize,
    height: imageSize,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginVertical: 20,
  },
  addPhotoButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPhotoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});