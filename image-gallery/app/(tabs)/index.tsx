import React, { useState, useEffect } from 'react';
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
 
export default function ImageGallery(){
  const [images, setImages]= useState([]);
  const [selectedImage, setSelectedImage]=useState(null);
  const [modalVisible, setModalVisible]=useState(false);
  const [loading, setLoading]= useState(true);
  const [hasPermission, setHasPermission]= useState(false);

  useEffect(()=>{
    requestPermissions();
  },[]);
  const requestPermissions=async ()=>{
    try{
const mediaPermission=await MediaLibrary.requestPermissionsAsync();
if (mediaPermission.status ==='granted'){
  setHasPermission(true);
  loadImages(); 
} else{
  Alert.alert("permission required", "please grant media library access", 
    [
      {text:"Cancel", style:'cancel'},
      {text:"Settings", onPress: ()=> requestPermissions()}
    ]
  );


}

    }catch(error){ 
      console.error("error requesting permissions", error)
    }
  };
  const loadImages=async()=>{
    try{
setLoading(true);
const media=await MediaLibrary.getAssetsAsync({
  mediaType:"photo",
  first: 10,
  sortBy:[[MediaLibrary.SortBy.creationTime, false]]
});
setImages(media.assets);
    }catch (error){
      console.error("error loading images", error);
      Alert.alert("error","failed to load images")
    } finally{
      setLoading(false);
    }
  };
  const openImagePicker=async()=>{
    try{
const permissionResult=await ImagePicker.requestMediaLibraryPermissionsAsync();
if (permissionResult.granted === false){
  Alert.alert("permission required", "permission to access camera roll is required!");

  return
}
const result=await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing:true,
  aspect:[1,1],
  quality:0.8,
});
if(!result.canceled && result.assets[0]){
  await loadImages();
}
    }catch (error){
      console.error("error picking image", error);
    }

  };
  const openCamera=async()=>{
    try{
const permissionResult=await ImagePicker.requestCameraPermissionsAsync();
if (permissionResult.granted ===false){
  Alert.alert('permission required','permission to access camera is required!')
  return;
}
const result=await ImagePicker.launchCameraAsync({
  allowsEditing: true,aspect:[1,1],quality:0.8
});
if(!result.canceled && result.assets[0]){
  await loadImages();
}
    }catch(error){
      console.error("error opening camera", error)
    }
  };
  const openImage=(image)=>{
    setSelectedImage(image);
    setModalVisible(true);
  };
  const closeModal=()=>{
    setModalVisible(false);
    setSelectedImage(null);
  };
  const showactionsheet=()=>{
    Alert.alert(
      "add photo",
      "choose an option",
      [
        {text:"camera", onPress: openCamera},
        {text: "photo library", onPress: openImagePicker},
        {text: "Cancel", style:"cancel"}
      ]
    )
  };
  const renderImage = ({item})=>(
    <TouchableOpacity style={styles.imageContainer}
    onPress={()=>openImage(item)}
    activeOpacity={0.8}>
      <Image source={{uri: item.uri}} style= {styles.image} resizeMode='cover'/>
    </TouchableOpacity>
  );
   if (!hasPermission) {
    return (
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
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
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
  );

};
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