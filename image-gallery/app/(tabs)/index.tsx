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
 
export default function ImageGallery(){
  const [images, setImages]= useState([]);
  const [selectedImage, setSelectedImage]=useState(null);
  const [modalVisible, setModalVisible]=useState(false);
  const [loading, setLoading]= useState(true);
  const [haspermission, setHasPermission]= useState(false);

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
        {text:"camera"}
      ]
    )
  }
};