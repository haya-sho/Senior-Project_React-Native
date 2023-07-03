
import React, { Dispatch, SetStateAction, memo, useRef } from 'react';
import { StyleSheet, Dimensions, Image, Animated, PanResponder, View, TouchableWithoutFeedback, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { cards } from '../../data/cards';
import { Cards } from '../../data/globals';

import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

//ストレージの作成
const storage: Storage = new Storage({
  // 最大容量
  size: 1000,
  // バックエンドにAsyncStorageを使う
  storageBackend: AsyncStorage,
  // キャッシュ期限(null=期限なし)
  defaultExpires: null,
  // メモリにキャッシュするかどうか
  enableCache: true,
  // 初期化時にデータを同期するためのオプション
  sync: {},
})

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

type Props = {
  index: number;
  card: Cards;
  setPage: Dispatch<SetStateAction<string>>;
  setIndex: Dispatch<SetStateAction<number>>;
  scheduleNotificationAsync: Function;
};

const SERVER_URL = "https://soranomix-api-server.onrender.com";

const TinderSwipe: React.FC<Props> = memo(({ index, card, setPage, setIndex, scheduleNotificationAsync }) => {

  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 120) {
          Animated.spring(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gestureState.dy },
            useNativeDriver: true,
          }).start(async () => {

            console.log("LIKE");

            const postObj: Cards = {
              ...cards[index],
            };
            postObj.images = JSON.stringify(postObj.images);
            postObj.publicTransport = JSON.stringify(postObj.publicTransport);
            postObj.car = JSON.stringify(postObj.car);
      
            const postData = await fetch(
              `${SERVER_URL}/api/favorites`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: 1, ...postObj }),
              }
            ).then((data) => data.json());
            console.log(postData);

            scheduleNotificationAsync();

            storage
            .load({key: 'dataKey'})
            .then(res => console.log(res))
            .catch(err => console.warn(err))

            // // ストレージに保存
            // storage.save({
            //   key: 'ZENN',
            //   data: {
            //     col1: 'hoge',
            //     col2: 100
            //   },
            // });

          });
        } else if (gestureState.dx < -120) {
          Animated.spring(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gestureState.dy },
            useNativeDriver: true,
          }).start(() => {});
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View>
      <Animated.View
        {...panResponder.panHandlers}
        key={index}
        style={[
          { transform: [
            ...position.getTranslateTransform(),
            {
              rotate: position.x.interpolate({
                inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
                outputRange: ['-10deg', '0deg', '10deg'],
                extrapolate: 'clamp',
              }),
            },
            ] },
          styles.cardContainer,
        ]}
      >
        <Animated.View
          style={{
            transform: [{ rotate: "30deg" }],
            position: "absolute",
            top: 40,
            right: 40,
            zIndex: 1000,
            opacity: position.x.interpolate({
              inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
              outputRange: [1, 0, 0],
              extrapolate: 'clamp',
            }),
          }}
        >
          <Icon name="arrow-undo-outline"
            style={{
              backgroundColor: "#9e1b1b",
              color: "white",
              borderRadius: 28,
              fontSize: 35,
              padding: 10,
              overflow: "hidden",
            }}
          />
        </Animated.View>
        <Animated.View
          style={{
            transform: [{ rotate: "-30deg" }],
            position: "absolute",
            top: 40,
            left: 40,
            zIndex: 1000,
            opacity: position.x.interpolate({
              inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
              outputRange: [0, 0, 1],
              extrapolate: 'clamp',
            }),
          }}
        >
          <Icon name="thumbs-up-outline"
            style={{
              backgroundColor: "rgb(70, 100, 200)",
              color: "white",
              borderRadius: 28,
              fontSize: 35,
              padding: 10,
              overflow: "hidden",
            }}
          />
        </Animated.View>
        <View style={{ flex: 1 }}>
          {typeof card.images === "string"
          ? JSON.parse(card.images).map((uri: string, index: number) =>
            <Image
              key={index}
              style={styles.cardImage}
              source={{ uri: uri }}
            />)
          : card.images.map((uri: string, index: number) =>
            <Image
              key={index}
              style={styles.cardImage}
              source={{ uri: uri }}
            />
          )}
          <TouchableWithoutFeedback onPressOut={() => { setPage("detail"); setIndex(index) }}>
            <View style={styles.cardDetailContainer}>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardText} >{card.title}</Text>
              </View>
              <View style={styles.cardTextTokimekiContainer}>
                <Text style={styles.cardTextAddressTitle}>
                  <Icon name="location-outline" style={styles.cardTextAddressTitle}/>
                  所在地
                </Text>
                <Text style={styles.cardTextPostCode}>{`〒${card.postCode}`}</Text>
                <Text style={styles.cardTextAddress}>{card.address}</Text>
                <Text style={styles.cardTextTokimeki}>大人も子供も楽しめる、〇〇が美味しい、入場料無料、朝も夜も楽しめる、駅近、駐車場無料、映えスポット、カップルにおすすめ、ペットOK、〇〇通り・施設近く、食べ歩きOK、コスパ最高、ちょっと贅沢、記念日デート、〇〇が綺麗、アニメテレビに登場</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    height: SCREEN_HEIGHT - 200,
    width: SCREEN_WIDTH,
    padding: 10,
    top: 115,
    position: 'absolute',
    shadowColor: 'rgb(200, 200, 200)',
    shadowOffset: {
      width: 0,
      height: 0.5,
    },
    shadowOpacity: 0.8,
  },
  cardImage: {
    flex: 1,
    resizeMode: "cover",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  cardDetailContainer: {
    height: 250,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'white',
    borderBottomEndRadius: 20,
    borderBottomStartRadius: 20,
  },
  cardTextContainer: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: 'rgb(230, 230, 230)',
  },
  cardText: {
    fontSize: 28,
  },
  cardTextTokimekiContainer: {
    paddingTop: 10,
  },
  cardTextAddressTitle: {
    fontSize: 23,
    paddingBottom: 8,
    color: 'rgb(80, 80, 80)',
  },
  cardTextPostCode: {
    paddingLeft: 5,
    paddingBottom: 3,
    color: 'rgb(100, 100, 100)',
  },
  cardTextAddress: {
    fontSize: 20,
    paddingLeft: 5,
    paddingBottom: 1,
    color: 'rgb(100, 100, 100)',
  },
  cardTextTokimeki: {
    fontSize: 20,
    color: 'rgb(100, 100, 100)',
  }
});

export default TinderSwipe;
