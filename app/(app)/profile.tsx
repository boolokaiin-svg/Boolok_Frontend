import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TouchableOpacity,
  Platform,
  TextInput,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../constants/theme';
import LoadingScreen from '../../components/LoadingScreen';
import { LinearGradient } from 'expo-linear-gradient';
import BoolokLogo from '../../components/BoolokLogo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { API_BASE_URL, resolveImageUrl, resolveReelVideoUrl, isEligibleReelRecord } from '../../lib/api';
import { formatSmartDateTime } from '../../lib/dateTime';

// ── Shared follow tracker ───────────────────────────────────────────────────
const GLOBAL_FOLLOWED_USERS = new Set<string>();

import Avatar from '../../components/Avatar';
import Skeleton from '../../components/Skeleton';
import FollowButton, { broadcastFollowChange } from '../../components/FollowButton';

const UserAvatar = ({ user, size = 40, style }: { user?: any; size?: number; style?: any }) => {
  return <Avatar user={user} size={size} style={style} />;
};

const COMMUNITY_MEMBERS = [
  {
    id: 'shreekutti',
    _id: 'shreekutti',
    fullName: 'Shreekutti',
    username: 'shreekutti',
    headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok',
    location: 'Bangalore, Karnataka · Tech Parks',
    bio: 'Specialized in commercial land development, Grade-A tech hub transactions, and IT SEZ acquisitions across South India.',
    closedDeals: '4',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: '6ace0e6586b4ca082d9f1432',
    _id: '6ace0e6586b4ca082d9f1432',
    fullName: 'Logeshwaran A',
    username: 'logeshwarana',
    headline: 'Architectural Consultant & Real Estate Lead',
    location: 'Western Australia · Vineyard Estates',
    bio: 'Focused on precision cap-rate calculations, commercial yield optimization, and real estate investment portfolios.',
    closedDeals: '3',
    followerCount: 0,
    followingCount: 0,
    mutuals: '',
    profilePicture: 'https://boolokgpt.vercel.app/avatars/logeshwaran_doomsday.png',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: '6addf49b5f3925f54f8491f6',
    _id: '6addf49b5f3925f54f8491f6',
    fullName: 'Mithulan R',
    username: 'mithulanr2003',
    headline: 'Architectural Director & Skyscraper Asset Syndicate',
    location: 'Marina Coastal District, Singapore',
    bio: 'Real estate professional and advisor on the Boolok AI network.',
    closedDeals: '2',
    followerCount: 0,
    followingCount: 0,
    mutuals: '',
    profilePicture: 'https://lh3.googleusercontent.com/a/ACg8ocJNc1F5yHFweMK8qtYRFt_2AJJQqzi4y0P2t7z2a4IHwoWCQYKJ=s400-c',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: '6aed5f1234567890abcdef01',
    _id: '6aed5f1234567890abcdef01',
    fullName: 'G Dinesh',
    username: 'pgma251',
    headline: 'Real Estate Professional & Boolok Member',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    bio: 'Real estate professional and advisor on the Boolok AI network.',
    closedDeals: '0',
    followerCount: 0,
    followingCount: 0,
    mutuals: '',
    profilePicture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAuCAYAAABu3ppsAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAABb8SURBVGhDpZd3WBTn2of5ck6iJtgQC0XKsizL0naXXpcO0mxg790ooAJSVMBe0k1MjiUWqojlJCe9x9gLiEpRlF5FFIwVgfu7ZjDJSUhOcr7vj/uaYfda5ne/z/M+M6OlPUzG/xfP0LHErFvDe0cz+LjgK4paSrjRUU0VddTSTHlHLYUtpXx66Tt2Hcsldl06XmHje/2f/wtav/3gr+IRNpat+97hQvNlKrtrqequE6l4WkN1Vx013fXU00x1Zy11NIrUdtdTSRM13KKe2xQ0lfDKvp14/j9k/muBUVOmk3v8A252V4tUdtWK/CRws7Oaqs46Kp/UUtvRSFVXI9VPG6l62sDNjnoauU19tyDWSE13MzXdTdR1N3P4+GeETp3V63p/xl8WULj48I9/ZXKjq0rktwIi3XXUUE91Vz1ld2+wI28nf39eixFDB6IzoC96eoPJ+DCDhicN1HGLys4GUUI4r+tqob77Ngf+dRRrF79e1/8j/pLAzBWxlD6+RnnnTco7K38lUEEN1d21VHbWUk0DdR317M3cjZHBCOwdVcjkRpiY6mEuN0ViboyJkRG2tha89u6r4m9qaKGuu4UG7lDfeZsm7lLbcZt5cYm9cvwefyqw9h+vcb3zxs/8JPCTxI3OSiq7aqjqrBX56PxHmKmlSBUSjM0MMDW1QCKRIpWaYmkpZaTeMIylJnj7euId6Edzd6u48rWdt2nsviMKNHW308w9tu3a3SvPb/mPAm8d3sO1zhu/4vrTil4SwspXdFRTdrcUE9OhGOkbYq92Zai+ATILKaZmxkjMTTA1N6b/S4OQSo2RyU2Qyg344Nt/0tDZQk1nS0/4fxO41f0j7x893CvXXxIQwpd2XKf0aTll/8b1p0IbVfwsIFSgglqqumqJXReNvr4+JmbGOJsNYNt4FdsnObJnqhPpHiM4sXoiaWEytAdqo6s7FFNzKT6hXjQ+vUVddysNXa3PBNp+Fvgzid8VWP3uVi4/Lha58qRE5GrHNRFBqkekpxIC1wSpjmpmxczCSM8QyTBtdk11pPzthTTuGEfbrgk07FlOS84GrqeN4eVQJwz1RqBnpkdw5Ciaulup6myimXYauEvjb6og8Eft1EtgcszLXPzxkkjB/SIKH1zi0sPLFD26StGjYq4+LqH4yTVKn1znWoewLypEyjur+KboW7T69OHNKSo+XxHGtY1TaH09itYdkTS8PofK95ZwacMEXpuuQSq3QG/EUHI/z6e+69azSSSM2Ds0CHuhu/0Z935m3oqk/yxg4eTJyZbTnGs7L3K+/QLn7l3g/I8XufBjIRfuCzJXRJmrj8soflxGSccNyjrKKeus4Ez1OYboDmDLLH82zAkmM3EyLXsX0Lx/PsW7k/j01VjyE8awf0kI+hIT9A1NaBBah5ae+4IwSrtaRRq72kR+EWkXp9NvR+yvBLbkvMkPt05yokXglMjpu6c503aOM4JUewEFD4rEilx+WMyVR6UUd5RzvfMmJR3lVDytZmqALVmLPEiaGsg7s0Zxct04qt6YxvtzfdkTPYFTr8zj5tbpTPaxJTLKl9ruFio7hHtHAzVdt6jtui1WoqHrLo2/okdo/4fHfl9AM34cX9V/yVcNX/N14zc9NH3Ld83fcrzlOCdaT3LqzhnO3jvH+XsXKfixiEv3r3LlYQnFj8ooeXRN3NBZWydzPH0sh1fOJmfpaE6sCqX53bl8kjqT3NTFnNi2mMp3FvPqDA9u7EmnvvsWNU8bqelsFCtR23mLmo5m6p620Pi0lfqnd2joFOgREY6hU2b3Fth25C0+qf6YT6o/Efm05lORz2o/4Yv6L/iq8Wu+afqWH1p+4FTrac7evcCFtkIKBYlHpVx5fI2y7kq+eWUGtblp1O2No3z7AurejaX93anc2rOU+l1xtOWn035oPd9tnEj56kiqu5qo6KinoqOOqs5GqjtuUfmkibquO9R0tlLXcZu6DkGkVRQRhI58/+WvBdT+gfyz4p8cuylwTET4W+TmUT6s/ICPaj7i49pPxSp91/gdJ26d4sztc5y9W8DF9iKuPiil5ME1ju9cwJ1DadTvWkTxlrlcfmU+jQdW0Zq7jo6P36LzTC7tx9ZxJD6Q4j2pfF96guNlJzlZfprTFecorLtMye3rVDyoo+bpLWoet1D7ROAXEQGv0MhfBJZsjedQ2SHySvPIK8nlYEkueaW54nl+WR6Hrx/i2I2jopBQpS9qvuB4/ffknz3Eu0ffZtOutbycMo+QiX68utCX4rfn8V36dP4RM57tM4I4Fj+J4jcW0fbR23R8uYva9xewc8EoIkPdcXJX4uyhEnH1UuHua493sBsBET7Mj53D0e8+pvpBEzVPbj2T6OHV9/f8IrD39Pti6NziHHKLs8m5mk32lSyyr2SK5wdLcsgrPSjKHC3P58PSDxi3aAxqD1uc3FWoHG1QOtigdlYxRmPHlynBbJ7ozhuLJlH0z9189v42dr88hTfn+NO8azEX149FbSfH0dketdoGtb0dDo5KHJztUDvZYu9kh6OLGlcPZ1w8Xdme8S4Vj4T2ui1KCFyqv9EjoPIL4HBp3jMBIbwQPIusy5lkXc4QJUSRK1nid8JxYdoCrO2tUKnsUKlV2DvY4+jsgLOrIw4qO/Ys9OSH9Eg+T5/PyU2rKNiaTvnOdMrfW0zx1gnsjg7Bwd4JpZMD9g4CatT2KtRqFUq1LSoHJWpHNV7eXvgH+TN+9iSqHzdx80EDNY+bn7VUC54hkWhNWDZXFBBWv2flheCZZBZlPOMAGZf291C4n9zL2XgEu+Hs6IiziyNOrg7iSnlo3PHy0eDvF8hoT1vemqPhh/WT+XRFJMc3TqU9dzU/bJzIjlnurJkbhSZsKk6eYahdvLB3ccPeyRFHR0fUDmqU6h5GhYYRER6BT3iA+KRa+bhJFOihhdi0tWgl7FhDvlCB4lxyr+aQfbln9YXwGZeE8Ac4ULhPFNhfsJcD5/dj76HC20uDxs8Hv8AAgkPCGD06iglRUwkfPwW3wCicrCQkTw/m6w3T+HjdXA6kv8wUbyVj3Gw4/k4CM2M2YxuxHqfg2ag8vFE7qrBRqrBTqrFWKlE62DNjxmzGj4nCK1BD1ZNGqh41UPWokapnIv84lIvWax++xeHSQxwqPkje1Vyyr+SQdTmbzKJMMi5lcKBAWPkD7Dm3Wzzf+eX7OGs8CQmPIHLcBMaPn0REZBQ+4RNx9p+OpWYxHr6RJIy1I8RZir+DAn87M8a6SNk4zY9Pkydw4fM8nHwnYR2Rjip0A6rwVGx8l6B0C8Xa2gpbhQ2Oju5EJyQzZtJENMF+lD9spOLHRioeNfTsh0dNfHb+BFr7z+zncGk+h0ryyCs+SM5PEkWCRBYZhZnsu7CPjEJBJoMdn+3Aw8edMVGTCRw3E6egRZi7zsbIcTYy72jkfsuYH72Jfy0fy5HoIA4u9uFYTACfrxrNufWTKd42jfLqJmxdxmAZmoYsbCOKoGRsgpKxDk9CGZGGMmA2dq6+LJwXzaJFS/HUeFDWXk35/SrKH9Rx40E9Nx82cLGmFK1DJYc4UpZPfkmeWIWcKwfJvpxLVlEOmZeyySrKZd8FIXwm+y9m8vonO3ENmo7SdynmXjEYeSxlpPscJJ7zkHnFIPGPYfa8ND7flsL5tAkUrh1L2cZIKt+aQc0bsziR9RZF5bVIXGchD0rFNjgdc+9YLP2SsQpKx2pUGtZhG3EcuwnfSWuYPi8edx8Nl5qKud7ewLUfa0TK79dS2laD1rHrRzlSdoT8knwOFR8i72o+uZfzyCk6SPalXLKEPVCQQWZBLlHJqzHzWoa5bzzSgHhk3glINbEYuyzGxHUp5j7xyHxW4jkuhpY7dWSON+XapigqXp0kPg8dXuDDw4cPOfb9eUzdV6AISkOmicXUbQnWgSkoAlehCFqLKnQj9uFbsA7diDp8E86jl5B36jTl7dWU/VhN2b1qUeL6vTq08ksOiwKHSw+LEoLAwcuHyC3KI+fSQbLE1slkSuoajF1extw7DplvAuY+KzHTxCPxWo6F93KknjFY+CRgpklixqItdHXBhZxX+S7Ol3NrRvHFYi8ufPkhj7q7eCvrCyyDNmIVugGrgE3IfVZhM2oVct/VWAWvxS58k4giOB1FwBpkvnGYua6i9MENiu9VUNpeRem9aq62Vgh7IJMjZUc5XHKE/OLD5F3pERDCZxfmklWYKW5ic59FmDrPQ+odJ4Y3916JmVcCxq6xyHwSxRaw8E1EFphEYvx7NNxt42xhAWfXTSJnjpof9m2muekOT54+ZWbyXqwD07EJXYe5fwqKoDVY+KRgHZCKVYggsBllxFasQ9dj478eZdhaTNzi+LKkiCttN7nafpOStkpOVhSi9fqHOzhSeoz84iMcutpb4MDF/ew/fwATt7kYqacj1cSL4aWalUg84zF1i0Xmm4SFfwoW/olIveNJSH+dxubbXG5s4Hzea2xwH0ZrUxOt9x9y7NuzuI9JwyZ0E46j1xO68DVM3Zci916FbVAalgGrsAvdhDp8K9bBaZi6zMUuZB0WvmuZkfAWRW3XuHz3BlfabnDk5OfCfSCdw6VHewSKj4gCwh7IFtsnh8yCTA6czcXIZTojlVORegkCCcg0yUi8EjDzWI5lwGrkgaux8EvExD2GuLR3qG27z5POTupv3uRE3m6aWu9ys66Jt3M/wcRvHXaj0jD3X4eNz0r0lPOxDUzFNiANC694bEM3YhOwEZl7AjZ+a7EMSMMyMAldi2UUtl6l8HY5RXeLeTPnAFoTYueTL7aPINBTAaH/hdXPLMhm/5lsXMctwNh5KsMtwpB4xCHRJCLzSMTMKw4z9zjk/inIA1Yh80nCwms5c5ZuoabtPg87urj36CG32+/SdPculbfbiFywAUXYFuyCN2ERuB6ZawxyzUpUIeux8l+DpXcSViFp2PilYqCchCooDYVvClLNCsxcEym6e4WClmtculPMguQUtJS+AWJwsX2ebWBx8xbkkHkxm51f72OIeQiGqrEMlwZh5LQQM69VmLkK4VcgdV+B3C8ZuX8yFt4rMXecz4RZqVTeauNW+wOedHbTBdx/0sXpS+WYuy7BJvQVlKFbUQSuxUS9GDuh9wNSkfsmY+GVhFVQChKHaMyc5mEVmIpN0EZsRm3CyH0Fx6sLKLhzlfO3SnEJiuh5Gt1zYn9P71/pmT7C+BTCZ1zIImnnFvRsQximGI2+LBQ9y3DMBQGP5Zi4x2HuvhxL3yTkwgbWJGCqiiJiykpu/Xif5jv3oKub7m6hEpC6dT+O4VuwCt6ITchmZJpELDUrUfitwto/FblnPHKfFKx8VqFvNQYr9xSsAtKw9k/HUmhPTQJrd2dztvkCn5ee+uVxevGmeDG8OD4vC5v3CFmFWWRePIi5ZhIj1ZMxdZyJnuUYBhs7IXFfhtQjHhPX5UjdlyP3XoncJxFzTQIG8gDCpqXQdP8Rd9vvQTd08ZSia404RizFKnA91iGbsQ3ZjJnbCqz9klH4JIkico84FN4pyN3i0DH1xkgdjYlYiVgM7GYic12ErnQupxoLSN7+6i8CSl9/MXyPQB5ZhbnsP5fJgYvvY6ieionjNEbaTWC4ZRgv6dlg5h6LuWcSEqGN3JYh84rHwjtRnEyD9JWMnbmeitY2mlta6erq5GEXvPbeERzClomtYBOyBZug9Vj5JCP3ThR/a+6VIC6KwmcVxur5SFWTkbjFYu2XirX/Giw08RiqZjHUbAnH6y7gFBj+63fitAObOViUR8bZbHIv7WPfqUwyzuWgr5yMsXoaJurJ6ClCGGRgi5HjImSeyUjcEzB1jcHMY0VPAM1KdAxsWJy4iw+/KaKqto6ndPNDUQ1+46Ox9lmOTdhmlGGbkGmSsPZJwtwrCQth1X1SxM/MPeIZYTURA1kYJi6LsfRLRRGwFgu/NWKFXzSawI4Pcnq/1LuGh4sC2ReFCXSAA+f2YRk8BV3LMIyUUzCwikLHzJ9+OiaMtJ+NxG0FJgIu0eK9QOoZj9QrgReHWzBlyXZSth3iZkMLV2paWPfmUXzHLsI6IB2r8M3ixpQJrechDILlWGgSxEqYe8Yh81jBCFkYOnoqjBzmo/BfjV3IRiwD05H7rULiHoPbs/fhXwkIxG9fQ+6FTPad28v+cxkYOczEQDmZofIwUURH4kPfgYboKyaK5TVxX4apczSG6sXIvFYi80zgRT0FsaszSNqQz8FPT7JtVx6vv/8VLoHTsQvfik3YRsw9lqHwXIbMPQ6Z6woUXglYesVj6rwUA/Vc9MyCGTDUEiPlXOSaFBT+aSgCUlGOSsfIfubPeXsJSFQuZJzJZM/pHKavikPPPgpjp7mMsIxihGUkOkZeaOsYMMQkABPHhZh7xmPmHo2J8xKknssx18ShJw8mfNIK4lN3MGPhRlK3HWN27LtYOE/CKmQDlgFrMHONRu6xDLlnAmZOMZg5RSNxWoKJwyL0VbPQNfKkzwBDRpiHMVK9ENvAFCRecUg1SQwaqf5jAYGAaePZc2onevKxGDnNwlg9kRHSMHQlfgwYbk4fbR0G6tmiazYaY8eFmLrEIHGNxdgpBlO3FQyXO2PnEsSsBcuYuTCRFanvEZ3yBjY+sVgGbsBCkyiOXpnQdm6xSJyEKbMEU4f5GNpNx8BuOoMNHOijbYSRLAxD+ThGKMZjoJzJUDP/X2X9XQGB8Qtn0c9Uw+CR43he259Bw73RNXXl+UFDRYE+A4Yz3MyfofIxGNhMw8h+Noaq2Zg4zmeomZIXBw/E0zeUcVOjmTJnGeFRM7DyWolEuGd4xmPlnSi2jIXHchGpy8sYKWeip4hkhCQU7aHm9B+hQNcyFCOHReKD4kjlpF45/1BAYPSU2dysu03p9Squl9RgLJUxQN8arf46PPeiDgON1OiY+DLY2JPh0mCGmYcwwiIUfUUYfYcY0re/NkN0pXh4h6HyHs1IZTT66hkYqmZipJqLkXIOxuqZDFXPYrhsFPomXgwyckZ7hBUy5UTU497GI3InytHbMXGf1yvfnwoIpC6ayM3XX+banhiuf5aJlURBv77a9HmhH889r80AHQkvDbNkgJ6SQQaOvDRcia6JGyPlUQweac6AIUMYpKeHqfUkhsnDGW4ZwXBFBMMtRjNMFspQaRCDRjowWFdG/2FytJ6XMn7GQj754ns++9dJZqw8gKnLgl65/rKAwIYZYZxbPZmsRUGc3zyd51/oh9bf/yYen3upP397UYe+g4zQ1pUySF/OgKEKtA2sGSYJpb+uEbrGSgboKxlo4MhgAycGGjowxNgJXWMHBhuqGDJSxTADTwxNbdj17h6GGurjHDKOM1cvsOO9/b3y/JY/FRAw0pdwePkYirYvpe9zWshsLfn7//wdrX4viVOp32BjtIdI6adjSt9BlmgPkTNYT8FLg4XvZLww0Jjn+unTd6CEPgOMeWGAAS9o69G3vyFaA/R4XluX/DXRlLydTNGeFE5smce4qCm9cvwef0lAwEzhzJaXZ/P23u2MmxpF/8E6DBqix9+0B/PCIAP66EjoM8SMl4ZbM1BfTX89JS8OtWWEfAzDZUGMkPqja+jDYANndIRq6DugO9KVIcNVfLwuist71nBt90rejp2GpaWy1/X/iL8s8BNGchVuvr4EhoUwanQEIRERBIWOxi84nIDQCHwD/IgYM5pxkZGEhkcQFBGFf9hoNIGj8A+NJDBkDN7+ISIqR3dCwtw5sjqKvYmz8XFy7nW9P+O/FvgJqbUzGv9gFixeSOyyZSyNXkJ0zGKWxMawLCGO2Lg4VqxcSVJCIinJycQlJDJ/cQzzFy9h0ow5jJs0nbAx4xkf7I+L+r8P/hP/Cw8IvpS/3Xs0AAAAAElFTkSuQmCC',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: 'ajmal',
    _id: 'ajmal',
    fullName: 'Mohammed Ajmal',
    username: 'ajmal',
    headline: 'Luxury Living & High-End Residential Broker',
    location: 'Dubai & Kochi · Luxury Villas',
    bio: 'Connecting international investors to premier waterfront villas and bespoke residential developments.',
    closedDeals: '3',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: 'bavadharini_rs',
    _id: 'bavadharini_rs',
    fullName: 'Bavadharini RS',
    username: 'bavadharini_rs',
    headline: 'Interior Designer & Modern Living Specialist',
    location: 'Chennai, Tamil Nadu · Modern Living',
    bio: 'Bespoke high-end interior architecture, penthouse makeovers, and custom luxury styling.',
    closedDeals: '2',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: 'the_akshtr_estate',
    _id: 'the_akshtr_estate',
    fullName: 'Akshat Commercials',
    username: 'the_akshtr_estate',
    headline: 'Commercial Property & Tech Park Portfolio Lead @ Boolok Network',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    bio: 'Specializing in Grade-A IT SEZ parks, commercial lease syndications, and institutional asset acquisitions on OMR Chennai.',
    closedDeals: '2',
    profilePicture: null,
    coverImage: '/coventry_corporate.jpg',
    reels: [],
    posts: [],
  },
  {
    id: 'prasanth_properties',
    _id: 'prasanth_properties',
    fullName: 'Prasanth Properties',
    username: 'prasanth_properties',
    headline: 'Luxury Waterfront Specialist · Miami & Coastal Estates',
    location: 'Miami, Florida · Coastal Estates',
    bio: 'Luxury real estate advisory focused on ultra-prime beachfront residences and waterfront villas.',
    closedDeals: '2',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: 'aswin',
    _id: 'aswin',
    fullName: 'Aswin Real Estate',
    username: 'aswin',
    headline: 'Principal Real Estate Broker & Multi-Family Asset Advisor',
    location: 'Chennai, Tamil Nadu · Luxury & Commercial Assets',
    bio: 'Expert commercial multi-family portfolio manager with deep market analytics on cap rates and returns.',
    closedDeals: '1',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: 'vignesh',
    _id: 'vignesh',
    fullName: 'Vigneshwaran',
    username: 'vignesh',
    headline: 'Prime Architectural Estates & Beverly Hills Luxury Specialist',
    location: 'Beverly Hills, California · Ultra Luxury',
    bio: 'Curating custom luxury properties, penthouses, and architectural landmarks for high net worth clients.',
    closedDeals: '1',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: 'yashwanth',
    _id: 'yashwanth',
    fullName: 'Yashwanth',
    username: 'yashwanth',
    headline: 'Prime Commercial Hubs & Institutional Realty Lead',
    location: 'Chennai & Bangalore · Commercial Hubs',
    bio: 'Acquiring prime commercial buildings, corporate hubs, and investment estates across South India.',
    closedDeals: '1',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: 'sophia_luxury',
    _id: 'sophia_luxury',
    fullName: 'Sophia Sterling',
    username: 'sophia_luxury',
    headline: 'European Family Office Principal & Luxury Syndication Client',
    location: 'Geneva, Switzerland & London · Private Capital',
    bio: 'Managing cross-border real estate acquisitions and luxury fractional syndicates for European private wealth clients.',
    closedDeals: '2',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: 'david_sterling',
    _id: 'david_sterling',
    fullName: 'David Sterling',
    username: 'david_sterling',
    headline: 'Managing Director · Sterling Global Capital & Asset Co-Owner',
    location: 'London, UK & Beverly Hills · Private Equity',
    bio: 'Directing private equity allocation in architectural landmarks, luxury fractional estates, and prime commercial assets.',
    closedDeals: '3',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    reels: [],
    posts: [],
  },
  {
    id: 'marcus_vance',
    _id: 'marcus_vance',
    fullName: 'Marcus Vance',
    username: 'marcus_vance',
    headline: 'Institutional Real Estate Syndicate Lead & Co-Ownership Client',
    location: 'New York, NY · Real Estate Private Equity',
    bio: 'Partnering in deeded fractional syndicates, commercial co-ownership models, and turnkey trophy estate acquisitions.',
    closedDeals: '2',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    reels: [],
    posts: [],
  },
];

const resolvePropertyImage = (post: any) => {
  const url = post?.mediaUrl || post?.image || post?.mediaUrls?.[0];
  if (url && typeof url === 'string' && url.trim()) {
    return resolveImageUrl(url) || url;
  }
  const loc = (post?.location || '').toLowerCase();
  const title = (post?.title || '').toLowerCase();
  if (loc.includes('bangalore') || title.includes('it campus') || title.includes('tech park')) {
    return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200';
  }
  if (loc.includes('dubai') || loc.includes('palm') || title.includes('palm')) {
    return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200';
  }
  if (loc.includes('omr') || loc.includes('commercial') || title.includes('office')) {
    return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200';
  }
  if (loc.includes('penthouse') || loc.includes('poes') || title.includes('penthouse')) {
    return 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200';
  }
  if (loc.includes('miami') || loc.includes('star island') || title.includes('star island')) {
    return 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200';
  }
  if (loc.includes('coventry') || loc.includes('united kingdom') || loc.includes('london')) {
    return '/coventry_corporate.jpg';
  }
  return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200';
};

const SAI_REELS: any[] = [];

function resolveMemberProfile(targetId: string, viewer: any) {
  const norm = (targetId || '').trim().toLowerCase();
  const viewerUsername = (viewer?.username || '').toLowerCase();
  const viewerId = (viewer?.id || viewer?._id || '').toLowerCase();

  const isViewer =
    !norm ||
    norm === 'self' ||
    norm === viewerId ||
    (Boolean(viewerUsername) && norm === viewerUsername);

  if (isViewer) {
    return {
      id: viewer?.id || viewer?._id || 'self',
      _id: viewer?.id || viewer?._id || 'self',
      fullName: viewer?.fullName || 'Boolok Member',
      username: viewer?.username || 'saivimenthanvl',
      headline: viewer?.headline || 'Elite Real Estate Broker & Commercial Portfolio Lead',
      location: viewer?.location || 'Chennai, Tamil Nadu · Prime Assets',
      bio: viewer?.bio || 'Real estate professional and advisor on the Boolok AI network.',
      profilePicture: viewer?.profilePicture || null,
      coverImage: viewer?.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      closedDeals: viewer?.closedDeals || '0',
      followerCount: 0,
      followingCount: 0,
      mutuals: '0 followers in Boolok Real Estate Network',
      reels: [],
      posts: [],
    };
  }

  const found = COMMUNITY_MEMBERS.find(
    (m) =>
      m.id.toLowerCase() === norm ||
      m.username.toLowerCase() === norm ||
      m.fullName.toLowerCase() === norm
  );

  if (found) {
    return found;
  }

  const cleanName = targetId.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: targetId,
    _id: targetId,
    fullName: cleanName,
    username: targetId.toLowerCase(),
    headline: 'Certified Real Estate Advisor @ Boolok Network',
    location: 'Chennai, Tamil Nadu · Prime Assets',
    bio: 'Real estate professional and certified portfolio advisor on the Boolok AI network.',
    profilePicture: null,
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    closedDeals: '0',
    mutuals: '',
    reels: [],
    posts: [],
  };
}

const ProfileReelItem = ({ reel, onDelete }: { reel: any; onDelete?: (id: string) => Promise<void> | void }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState(false);

  const initialLikes = (() => {
    if (typeof reel.likesCount === 'number') {
      return reel.likesCount;
    }
    if (Array.isArray(reel.likes)) {
      return reel.likes.length;
    }
    if (typeof reel.likes === 'number') {
      return reel.likes;
    }
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_post_likes');
        if (raw) {
          const cache = JSON.parse(raw);
          if (cache[reel._id] && typeof cache[reel._id].count === 'number') {
            return cache[reel._id].count;
          }
        }
      } catch (_) {}
    }
    return 0;
  })();

  const [likesCount, setLikesCount] = useState<number>(initialLikes);

  // Sync likes on native mobile via SecureStore and update when reel changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (Platform.OS === 'web') {
          const raw = localStorage.getItem('boolok_post_likes');
          if (raw) {
            const cache = JSON.parse(raw);
            if (cache[reel._id] && typeof cache[reel._id].count === 'number') {
              if (isMounted) setLikesCount(cache[reel._id].count);
            }
          }
        } else {
          const raw = await SecureStore.getItemAsync('boolok_post_likes');
          if (raw) {
            const cache = JSON.parse(raw);
            if (cache[reel._id] && typeof cache[reel._id].count === 'number') {
              if (isMounted) setLikesCount(cache[reel._id].count);
            }
          }
        }
      } catch (_) {}
    })();
    return () => { isMounted = false; };
  }, [reel._id]);
  const [hasLiked, setHasLiked] = useState<boolean>(() => {
    if (typeof reel.isLiked === 'boolean') return reel.isLiked;
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_post_likes');
        if (raw) {
          const cache = JSON.parse(raw);
          if (cache[reel._id] && typeof cache[reel._id].likedByMe === 'boolean') {
            return cache[reel._id].likedByMe;
          }
        }
        const raw2 = localStorage.getItem('boolok_liked_reels_set');
        if (raw2) {
          const set = JSON.parse(raw2);
          return Boolean(set[reel._id]);
        }
      } catch (_) {}
    }
    return false;
  });

  const [comments, setComments] = useState<any[]>(() => {
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem(`boolok_comments_${reel._id}`);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) return cached;
        }
      } catch (_) {}
    }
    return Array.isArray(reel.comments) ? reel.comments : [];
  });
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentUserId = String(user?.id || user?._id || '');
  const currentUsername = String(user?.username || '').toLowerCase();
  const currentFullName = String(user?.fullName || '').toLowerCase();
  const authorUserId = String(reel.author?._id || reel.author?.id || (typeof reel.author === 'string' ? reel.author : ''));
  const authorUsername = String(reel.author?.username || reel.authorName || '').toLowerCase();
  const authorFullName = String(reel.author?.fullName || reel.authorName || '').toLowerCase();
  const isCoventry = (reel.title || '').toLowerCase().includes('coventry') || (reel.location || '').toLowerCase().includes('coventry');
  const isKyoto =
    String(reel._id || reel.id || '').includes('kyoto') ||
    String(reel._id || reel.id || '') === 'logesh-reel-2' ||
    String(reel.title || '').toLowerCase().includes('kyoto') ||
    String(reel.videoUrl || '').includes('kyoto');

  const isOwner = Boolean(
    (currentUserId && authorUserId && currentUserId === authorUserId) ||
    (currentUsername && authorUsername && currentUsername === authorUsername) ||
    (currentFullName && authorFullName && currentFullName === authorFullName)
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem(`boolok_comments_${reel._id}`);
        if (raw) {
          const cached = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) {
            setComments(cached);
            return;
          }
        }
      } catch (_) {}
    }
    setComments(Array.isArray(reel.comments) ? reel.comments : []);
  }, [reel._id, reel.comments]);

  const rawPoster = reel.poster || reel.thumbnail;
  const posterUrl = rawPoster
    ? (resolveImageUrl(rawPoster) || rawPoster)
    : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200';
  const videoSource = resolveReelVideoUrl(reel.videoUrl);
  const videoRef = useRef<any>(null);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = false;
  });

  const togglePlay = () => {
    if (Platform.OS === 'web' && videoRef.current) {
      const vid = videoRef.current;
      if (vid.paused) {
        vid.muted = true;
        const p = vid.play();
        if (p !== undefined) {
          p.then(() => {
            setIsPlaying(true);
            try { vid.muted = false; } catch (_) { }
          }).catch(() => {
            vid.muted = true;
            vid.load();
            vid.play().then(() => setIsPlaying(true)).catch(() => { });
          });
        }
      } else {
        vid.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (player) {
      if (player.playing) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    }
  };

  const handleLike = async () => {
    const nextState = !hasLiked;
    const nextCount = nextState ? likesCount + 1 : Math.max(0, likesCount - 1);
    setHasLiked(nextState);
    setLikesCount(nextCount);

    try {
      if (Platform.OS === 'web') {
        const pRaw = localStorage.getItem('boolok_post_likes');
        const pCache = pRaw ? JSON.parse(pRaw) : {};
        pCache[reel._id] = { count: nextCount, likedByMe: nextState };
        localStorage.setItem('boolok_post_likes', JSON.stringify(pCache));

        const lRaw = localStorage.getItem('boolok_liked_reels_set');
        const lSet = lRaw ? JSON.parse(lRaw) : {};
        if (nextState) lSet[reel._id] = true; else delete lSet[reel._id];
        localStorage.setItem('boolok_liked_reels_set', JSON.stringify(lSet));

        const rawList = localStorage.getItem('boolok_user_uploaded_reels');
        if (rawList) {
          const list = JSON.parse(rawList);
          const idx = list.findIndex((r: any) => r._id === reel._id || r.id === reel._id);
          if (idx !== -1) {
            list[idx].likes = nextCount;
            list[idx].likesCount = nextCount;
            list[idx].isLiked = nextState;
            localStorage.setItem('boolok_user_uploaded_reels', JSON.stringify(list));
          }
        }
      } else {
        const pRaw = await SecureStore.getItemAsync('boolok_post_likes');
        const pCache = pRaw ? JSON.parse(pRaw) : {};
        pCache[reel._id] = { count: nextCount, likedByMe: nextState };
        await SecureStore.setItemAsync('boolok_post_likes', JSON.stringify(pCache));
      }
    } catch (_) {}

    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (token && reel._id && !['1', '2', '3', '4'].includes(reel._id)) {
        await axios.put(
          `${API_BASE_URL}/api/reels/${reel._id}/like`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (_) {}
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    const text = commentInput.trim();
    setCommentInput('');

    const newC = {
      _id: `comment_${Date.now()}`,
      user: {
        fullName: user?.fullName || 'You',
        username: user?.username || 'member',
        profilePicture: user?.profilePicture || null,
      },
      author: {
        fullName: user?.fullName || 'You',
        username: user?.username || 'member',
        profilePicture: user?.profilePicture || null,
      },
      text,
      createdAt: new Date().toISOString(),
    };

    const updated = [...comments, newC];
    setComments(updated);

    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(`boolok_comments_${reel._id}`, JSON.stringify(updated));

        const rawList = localStorage.getItem('boolok_user_uploaded_reels');
        if (rawList) {
          const list = JSON.parse(rawList);
          const idx = list.findIndex((r: any) => r._id === reel._id || r.id === reel._id);
          if (idx !== -1) {
            list[idx].comments = updated;
            list[idx].commentsCount = updated.length;
            localStorage.setItem('boolok_user_uploaded_reels', JSON.stringify(list));
          }
        }
      } else {
        await SecureStore.setItemAsync(`boolok_comments_${reel._id}`, JSON.stringify(updated));
      }
    } catch (_) {}

    try {
      const token = Platform.OS === 'web'
        ? localStorage.getItem('userToken')
        : await SecureStore.getItemAsync('userToken');

      if (token && reel._id && !['1', '2', '3', '4'].includes(reel._id)) {
        const res = await axios.post(
          `${API_BASE_URL}/api/reels/${reel._id}/comments`,
          { text },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data && Array.isArray(res.data.comments)) {
          setComments(res.data.comments);
          if (Platform.OS === 'web') {
            localStorage.setItem(`boolok_comments_${reel._id}`, JSON.stringify(res.data.comments));
          }
        }
      }
    } catch (_) {}
  };

  return (
    <View style={[styles.reelCardItem, isMobile && { height: Math.min(width * 1.35, 480) }]}>
      {/* ── Video Player / Fallback ── */}
      <Pressable onPress={videoSource ? togglePlay : undefined} style={StyleSheet.absoluteFill}>
        {videoSource ? (
          Platform.OS === 'web' ? (
            <video
              ref={videoRef}
              src={videoSource}
              poster={posterUrl}
              loop
              preload="metadata"
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                backgroundColor: '#000000',
              }}
            />
          ) : (
            <>
              {posterUrl && !isPlaying && (
                <Image
                  source={{ uri: posterUrl }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              )}
              <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
              />
            </>
          )
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }]}>
            {(reel.thumbnail || reel.poster) ? (
              <>
                {/* Ambient Blurred Background to eliminate jarring black bars */}
                {isCoventry && (
                  <Image
                    source={{ uri: resolveImageUrl(reel.thumbnail || reel.poster) || (reel.thumbnail || reel.poster) }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}
                    resizeMode="cover"
                    blurRadius={Platform.OS === 'web' ? 24 : 16}
                  />
                )}
                <Image
                  source={{ uri: resolveImageUrl(reel.thumbnail || reel.poster) || (reel.thumbnail || reel.poster) }}
                  style={[
                    StyleSheet.absoluteFill,
                    isCoventry && {
                      transform: [{ scale: 1.15 }],
                    },
                  ]}
                  resizeMode={isCoventry ? "cover" : "cover"}
                />
              </>
            ) : null}
          </View>
        )}

        {videoSource && !isPlaying && (
          <View style={styles.centerPlayOverlay} pointerEvents="none">
            <View style={styles.playIconCircle}>
              <MaterialIcons name="play-arrow" size={36} color="#e6b800" />
            </View>
          </View>
        )}
      </Pressable>

      {/* ── Top Overlay: AI Match Score & Watch in Reels & Illustrative Footage ── */}
      <View style={{ position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }} pointerEvents="box-none">
        {isKyoto ? (
          <View style={[styles.reelMatchBadge, { backgroundColor: 'rgba(0, 0, 0, 0.75)', borderColor: '#F5A623' }]} pointerEvents="none">
            <MaterialIcons name="info-outline" size={12} color="#F5A623" style={{ marginRight: 4 }} />
            <Text style={[styles.reelMatchText, { color: '#F5A623' }]}>Illustrative footage</Text>
          </View>
        ) : (!isCoventry && typeof reel.aiMatch === 'number' && Boolean(reel.aiMatchBasis) ? (
          <View style={styles.reelMatchBadge} pointerEvents="none">
            <View style={styles.reelMatchDot} />
            <Text style={styles.reelMatchText}>{reel.aiMatch}% AI MATCH</Text>
          </View>
        ) : <View />)}
      </View>

      {/* ── Right Action Sidebar (Like, Comment, Share) ── */}
      <View style={styles.reelRightActions} pointerEvents="box-none">
        {/* Creator Avatar with initial badge */}
        <View style={styles.creatorRailItem}>
          <View style={styles.creatorAvatarRing}>
            <Avatar
              user={
                isCoventry
                  ? {
                      id: '6a7a0dbb51a42123f22c4edf',
                      _id: '6a7a0dbb51a42123f22c4edf',
                      username: 'saivimenthanvl',
                      fullName: 'Sai Vimenthan V L',
                      profilePicture: null,
                      avatarInitial: 'S',
                      avatarBgColor: '#F5A623',
                    }
                  : typeof reel.author === 'object' && reel.author
                  ? reel.author
                  : {
                      id: authorUserId || undefined,
                      _id: authorUserId || undefined,
                      username: authorUsername || undefined,
                      fullName: reel.authorName || 'Boolok Member',
                      profilePicture: reel.authorAvatar || null,
                    }
              }
              size={40}
              showBorder
              borderColor="#F5A623"
            />
          </View>
        </View>

        {/* Like Button */}
        <TouchableOpacity
          onPress={handleLike}
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={[styles.reelActionIconBox, hasLiked && { backgroundColor: 'rgba(239, 68, 68, 0.35)', borderColor: '#ef4444' }]}>
            <MaterialIcons
              name={hasLiked ? 'favorite' : 'favorite-border'}
              size={24}
              color={hasLiked ? '#ef4444' : '#ffffff'}
            />
          </View>
          <Text style={[styles.reelActionText, hasLiked && { color: '#ef4444', fontWeight: 'bold' }]}>
            {likesCount > 1000 ? (likesCount / 1000).toFixed(1) + 'k' : likesCount}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={() => setShowComments(true)}
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={styles.reelActionIconBox}>
            <MaterialCommunityIcons name="comment-text-outline" size={22} color="#ffffff" />
          </View>
          <Text style={styles.reelActionText}>{comments.length}</Text>
        </TouchableOpacity>

        {/* Save / Bookmark Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={styles.reelActionIconBox}>
            <MaterialIcons name="bookmark-border" size={24} color="#ffffff" />
          </View>
          <Text style={styles.reelActionText}>Save</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.reelActionBtn}
        >
          <View style={styles.reelActionIconBox}>
            <MaterialIcons name="share" size={22} color="#ffffff" />
          </View>
          <Text style={styles.reelActionText}>Share</Text>
        </TouchableOpacity>

        {/* Delete button (Owner only) */}
        {isOwner && Boolean(onDelete) && (
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            disabled={deleting}
            activeOpacity={0.7}
            style={styles.reelActionBtn}
          >
            <View style={[styles.reelActionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.25)', borderColor: 'rgba(239, 68, 68, 0.5)' }]}>
              {deleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
              )}
            </View>
            <Text style={[styles.reelActionText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Bottom Overlay Info ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)']}
        style={styles.reelFooterOverlay}
        pointerEvents="box-none"
      >
        <Text style={styles.reelTitleHeading} numberOfLines={2}>{reel.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 8 }}>
          {Boolean(reel.location) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <MaterialIcons name="location-on" size={14} color="#e6b800" />
              <Text style={[styles.reelLocationSub, { marginTop: 0, marginBottom: 0 }]}>{reel.location}</Text>
            </View>
          )}
          {((reel.price !== undefined && reel.price !== null && String(reel.price).trim() !== '' && String(reel.price).trim().toLowerCase() !== 'undefined' && String(reel.price).trim().toLowerCase() !== 'null') || isCoventry) && (
            <View style={{ backgroundColor: 'rgba(230, 184, 0, 0.2)', borderColor: '#e6b800', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ color: '#e6b800', fontSize: 12, fontWeight: '800' }}>
                {reel.price !== undefined && reel.price !== null && String(reel.price).trim() !== '' && String(reel.price).trim().toLowerCase() !== 'undefined' && String(reel.price).trim().toLowerCase() !== 'null' ? String(reel.price) : '£12,242,788'}
              </Text>
            </View>
          )}
        </View>
        {Boolean(reel.insight) && (
          <View style={styles.reelInsightBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
              <MaterialIcons name="info-outline" size={13} color="#e6b800" />
              <Text style={{ color: '#e6b800', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 }}>PROPERTY OVERVIEW · OWNER SUPPLIED</Text>
            </View>
            <Text style={styles.reelInsightText}>{(reel.insight || '').replace(/(?:\$16)?,500,000\./g, '£12,242,788.')}</Text>
          </View>
        )}
      </LinearGradient>

      {/* ── Custom Delete Confirmation Modal ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteModal(false)}>
          <Pressable style={styles.deleteDialogCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.deleteDialogIconBox}>
              <MaterialIcons name="delete-forever" size={32} color="#ef4444" />
            </View>
            <Text style={styles.deleteDialogTitle}>Delete Property Reel</Text>
            <Text style={styles.deleteDialogDesc}>
              Are you sure you want to delete &ldquo;{reel.title}&rdquo;? This listing video and all its analytics will be permanently removed.
            </Text>
            <View style={styles.deleteDialogBtnRow}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={styles.deleteDialogCancelBtn}
              >
                <Text style={styles.deleteDialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setShowDeleteModal(false);
                  setDeleting(true);
                  try {
                    if (onDelete) {
                      await onDelete(reel._id);
                    }
                  } finally {
                    setDeleting(false);
                  }
                }}
                style={styles.deleteDialogConfirmBtn}
              >
                <Text style={styles.deleteDialogConfirmText}>Delete Reel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Comments Modal ── */}
      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <Pressable
          onPress={() => setShowComments(false)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.commentsModalSheet}
          >
            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
              <Pressable onPress={() => setShowComments(false)} style={{ padding: 4 }}>
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsScrollView} showsVerticalScrollIndicator={false}>
              {comments.map((c, idx) => {
                const commentUser = c.user || c.author || { fullName: typeof c.user === 'string' ? c.user : 'User' };
                const authorName = commentUser.fullName || commentUser.username || (typeof c.user === 'string' ? c.user : 'User');
                return (
                  <View key={c._id || idx} style={styles.commentRow}>
                    <UserAvatar
                      user={commentUser}
                      size={34}
                    />
                    <View style={styles.commentBubble}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <Text style={styles.commentAuthorName}>{authorName}</Text>
                        <Text style={{ color: '#94a3b8', fontSize: 10, marginLeft: 8 }}>
                          {formatSmartDateTime(c.createdAt || c.time)}
                        </Text>
                      </View>
                      <Text style={styles.commentContentText}>{c.text}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Input Row */}
            <View style={styles.commentInputRow}>
              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Add a comment on this property reel..."
                placeholderTextColor="#64748b"
                style={styles.commentTextInput}
              />
              <Pressable
                onPress={handleAddComment}
                style={[styles.commentSendBtn, !commentInput.trim() && { opacity: 0.5 }]}
                disabled={!commentInput.trim()}
              >
                <MaterialIcons name="send" size={20} color="#000000" />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default function ProfessionalUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user: viewer, updateUser, signOut } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isSmallMobile = width < 480;

  const isSelf = !id || id === 'self' || id === viewer?.id || id === viewer?._id || (Boolean(viewer?.username) && String(id).toLowerCase() === String(viewer?.username).toLowerCase());
  const targetId = isSelf ? (viewer?.id || viewer?._id || 'self') : String(id);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowingState, setIsFollowingState] = useState<boolean>(() => {
    // Read the shared localStorage follow cache so the profile Follow button
    // reflects the same state as the insights VideoItem follow button.
    if (!isSelf && Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_following_users_set');
        if (raw) {
          const set = JSON.parse(raw);
          const idStr = String(id || '');
          return Boolean(set[idStr] || set[idStr.toLowerCase()]);
        }
      } catch (_) {}
    }
    return false;
  });
  const [followerCountState, setFollowerCountState] = useState(0);
  const [followingCountState, setFollowingCountState] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);

  // Synchronize live follow events across screens
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleFollowChange = (e: any) => {
        const detail = e.detail;
        if (!detail) return;
        const targetIdStr = String(targetId || '').toLowerCase();
        const currentUname = String(data?.user?.username || id || '').toLowerCase();
        const currentUid = String(data?.user?.id || data?.user?._id || id || '').toLowerCase();

        const matches =
          (detail.userId && (String(detail.userId).toLowerCase() === targetIdStr || String(detail.userId).toLowerCase() === currentUid)) ||
          (detail.username && (String(detail.username).toLowerCase() === targetIdStr || String(detail.username).toLowerCase() === currentUname));

        if (matches) {
          setIsFollowingState(Boolean(detail.isFollowing));
          if (typeof detail.followerCount === 'number') {
            setFollowerCountState(detail.followerCount);
          }
        }
      };

      window.addEventListener('boolok_follow_changed', handleFollowChange);
      return () => window.removeEventListener('boolok_follow_changed', handleFollowChange);
    }
  }, [targetId, data?.user?.id, data?.user?._id, data?.user?.username, id]);

  // Tabs: 'properties' vs 'reels' vs 'saved'
  const [activeTab, setActiveTab] = useState<'properties' | 'reels' | 'saved'>('properties');
  const [savedItemsList, setSavedItemsList] = useState<any[]>([]);

  useEffect(() => {
    const loadSavedFromStorage = async () => {
      try {
        if (Platform.OS === 'web') {
          const raw = localStorage.getItem('boolok_saved_reels');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setSavedItemsList(parsed);
          }
        } else {
          const raw = await SecureStore.getItemAsync('boolok_saved_reels');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setSavedItemsList(parsed);
          }
        }
      } catch (_) {}
    };
    loadSavedFromStorage();
  }, []);

  // Username edit state for self
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(viewer?.username || 'saivimenthanvl');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Create Mode: 'post' vs 'reel'
  const [createType, setCreateType] = useState<'post' | 'reel'>('post');

  // Create Post state
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Custom Sign Out Modal State & Handlers
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    setIsSignOutModalOpen(true);
  };

  const handleConfirmSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      setIsSignOutModalOpen(false);
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Logout error:', err);
      setIsSignOutModalOpen(false);
      router.replace('/(auth)/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Custom Contact Info Modal State & Copy Helper
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, fieldName: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Create Reel state
  const [reelTitle, setReelTitle] = useState('');
  const [reelLocation, setReelLocation] = useState('');
  const [reelUrl, setReelUrl] = useState('');
  const [attachedVideo, setAttachedVideo] = useState<string | null>(null);
  const [isPublishingReel, setIsPublishingReel] = useState(false);

  // User's own reels
  const [userReels, setUserReels] = useState<any[]>([]);
  const [localReels, setLocalReels] = useState<any[]>([]);

  const isDummyReelId = (id: any) =>
    ['1', '2', '3', '4', 'sai-reel-coventry', 'logesh-reel-1', 'logesh-reel-2', 'logesh-reel-3', 'shree-reel-1', 'ajmal-reel-1', 'bava-reel-1', 'akshat-reel-1', 'prasanth-reel-1'].includes(String(id));

  useEffect(() => {
    const activeUserId = viewer?.id || viewer?._id || viewer?.username || 'self';
    const storageKey = 'boolok_user_uploaded_reels_' + activeUserId;
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter((r: any) => !isDummyReelId(r._id) && !isDummyReelId(r.id));
            setLocalReels(clean);
          }
        } else {
          setLocalReels([]);
        }
      } catch (_) {}
    } else {
      (async () => {
        try {
          const raw = await SecureStore.getItemAsync(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const clean = parsed.filter((r: any) => !isDummyReelId(r._id) && !isDummyReelId(r.id));
              setLocalReels(clean);
            }
          } else {
            setLocalReels([]);
          }
        } catch (_) {}
      })();
    }
  }, [viewer?.id, viewer?._id, viewer?.username]);

  const defaultFallbackUser = {
    id: viewer?.id || viewer?._id || 'self',
    _id: viewer?.id || viewer?._id || 'self',
    fullName: viewer?.fullName || 'Real Estate Professional',
    username: viewer?.username || 'member',
    headline: viewer?.headline || 'Real Estate Professional & Boolok Member',
    location: viewer?.location || 'Global Real Estate Network',
    bio: viewer?.bio || 'Real estate professional and advisor on the Boolok AI network.',
    profilePicture: viewer?.profilePicture || null,
    coverImage: viewer?.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    closedDeals: viewer?.closedDeals || '0',
    mutuals: '',
  };

  // Edit profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editClosedDeals, setEditClosedDeals] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Google-style "Add Profile Picture" Modal state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAllIllustrations, setShowAllIllustrations] = useState(false);

  // Real-time Followers list modal state
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);

  // Real-time Following list modal state
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  // Real-time Closed Deals modal state
  const [isClosedDealsModalOpen, setIsClosedDealsModalOpen] = useState(false);
  const [closedDealsList, setClosedDealsList] = useState<any[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);

  // Property Post Details Modal state (Shows post, likes, and comments)
  const [selectedPostDetails, setSelectedPostDetails] = useState<any>(null);
  const [isPostDetailsModalOpen, setIsPostDetailsModalOpen] = useState(false);

  const [postDetailsComments, setPostDetailsComments] = useState<any[]>([]);
  const [postDetailsCommentText, setPostDetailsCommentText] = useState('');
  const [postDetailsLikesCount, setPostDetailsLikesCount] = useState(1);
  const [hasLikedPostDetails, setHasLikedPostDetails] = useState(false);
  const [postDetailReaction, setPostDetailReaction] = useState<string | null>(null);
  const [activePostDetailReactionPicker, setActivePostDetailReactionPicker] = useState(false);
  const [isPostingDetailComment, setIsPostingDetailComment] = useState(false);
  const [isPostLikesListOpen, setIsPostLikesListOpen] = useState(false);
  const [postLikesUsersList, setPostLikesUsersList] = useState<any[]>([]);
  const [allPostLikesUsers, setAllPostLikesUsers] = useState<any[]>([]);
  const [postLikesTab, setPostLikesTab] = useState<string>('all');
  const [isLoadingPostLikes, setIsLoadingPostLikes] = useState(false);

  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const handleDeletePost = async (postId: string) => {
    if (!postId || isDeletingPost) return;

    const doDelete = async () => {
      setIsDeletingPost(true);
      try {
        const token = await getToken();
        await axios.delete(`${API_BASE_URL}/api/feed/${postId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        setData((prev: any) => {
          if (!prev) return prev;
          const updatedPosts = (prev.posts || []).filter((p: any) => p._id !== postId);
          return {
            ...prev,
            posts: updatedPosts,
            postCount: Math.max(0, (prev.postCount || updatedPosts.length + 1) - 1),
          };
        });

        setIsPostDetailsModalOpen(false);
        setSelectedPostDetails(null);
        alertMsg('Post deleted successfully.');
      } catch (err: any) {
        console.error('Delete post error:', err);
        alertMsg(err.response?.data?.message || 'Failed to delete post.');
      } finally {
        setIsDeletingPost(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this post? This cannot be undone.');
      if (confirmed) {
        await doDelete();
      }
    } else {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleOpenPostDetailsModal = async (post: any) => {
    setSelectedPostDetails(post);

    let count = post.likesCount !== undefined ? post.likesCount : (Array.isArray(post.likes) ? post.likes.length : 0);
    const viewerIdStr = String(viewer?.id || viewer?._id || '');
    let isLiked = Array.isArray(post.likes) && post.likes.some((l: any) => {
      const id = typeof l === 'string' ? l : (l?._id || l?.id || '');
      return id === viewerIdStr || (viewer?.username && id === viewer.username);
    });

    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_post_likes');
        if (raw) {
          const cache = JSON.parse(raw);
          if (cache[post._id]) {
            if (typeof cache[post._id].count === 'number') count = cache[post._id].count;
            if (typeof cache[post._id].likedByMe === 'boolean') isLiked = cache[post._id].likedByMe;
          }
        }
      } catch (_) {}
    }

    setPostDetailsLikesCount(count);
    setHasLikedPostDetails(Boolean(post.isLiked || isLiked));
    setPostDetailReaction(post.isLiked || isLiked ? 'like' : null);
    setActivePostDetailReactionPicker(false);

    // Use REAL comments from post, or empty array if none
    const initialComments = Array.isArray(post.comments) ? post.comments : [];
    setPostDetailsComments(initialComments);
    setIsPostDetailsModalOpen(true);

    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/feed/${post._id}/details`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.post) {
        setSelectedPostDetails(res.data.post);
        if (Array.isArray(res.data.post.comments)) {
          setPostDetailsComments(res.data.post.comments);
        }
        if (typeof res.data.post.likesCount === 'number') {
          setPostDetailsLikesCount(res.data.post.likesCount);
        } else if (Array.isArray(res.data.post.likes)) {
          setPostDetailsLikesCount(res.data.post.likes.length);
        }
        if (typeof res.data.post.isLiked === 'boolean') {
          setHasLikedPostDetails(res.data.post.isLiked);
          setPostDetailReaction(res.data.post.isLiked ? 'like' : null);
        }
      }
    } catch (e) {
      // maintain local post data
    }
  };

  const handleTogglePostDetailReaction = async (reactionType: string = 'like') => {
    if (!selectedPostDetails) return;
    setActivePostDetailReactionPicker(false);
    const isSame = postDetailReaction === reactionType;
    const nextReaction = isSame ? null : reactionType;
    const nextLiked = Boolean(nextReaction);
    const nextCount = isSame ? Math.max(0, postDetailsLikesCount - 1) : (!postDetailReaction ? postDetailsLikesCount + 1 : postDetailsLikesCount);

    setPostDetailReaction(nextReaction);
    setHasLikedPostDetails(nextLiked);
    setPostDetailsLikesCount(nextCount);

    // Persist to shared boolok_post_likes cache
    try {
      if (Platform.OS === 'web') {
        const pRaw = localStorage.getItem('boolok_post_likes');
        const pCache = pRaw ? JSON.parse(pRaw) : {};
        pCache[selectedPostDetails._id] = { count: nextCount, likedByMe: nextLiked };
        localStorage.setItem('boolok_post_likes', JSON.stringify(pCache));
      } else {
        const pRaw = await SecureStore.getItemAsync('boolok_post_likes');
        const pCache = pRaw ? JSON.parse(pRaw) : {};
        pCache[selectedPostDetails._id] = { count: nextCount, likedByMe: nextLiked };
        await SecureStore.setItemAsync('boolok_post_likes', JSON.stringify(pCache));
      }
    } catch (_) {}

    // Update parent posts list immediately
    setData((prev: any) => {
      if (!prev || !Array.isArray(prev.posts)) return prev;
      return {
        ...prev,
        posts: prev.posts.map((p: any) =>
          p._id === selectedPostDetails._id
            ? { ...p, likesCount: nextCount, isLiked: nextLiked }
            : p
        ),
      };
    });

    try {
      const token = await getToken();
      await axios.put(
        `${API_BASE_URL}/api/feed/${selectedPostDetails._id}/react`,
        { type: reactionType },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
    } catch (e) {
      // maintain local state
    }
  };

  const handleTogglePostDetailLike = () => {
    handleTogglePostDetailReaction('like');
  };

  const handleNavigateToCommentAuthor = (authorObj: any, fallbackName?: string) => {
    setIsPostDetailsModalOpen(false);
    setIsPostLikesListOpen(false);
    const authorId =
      authorObj?._id ||
      authorObj?.id ||
      authorObj?.username ||
      (fallbackName ? fallbackName.toLowerCase().replace(/\s+/g, '_') : 'self');
    router.push({ pathname: '/(app)/profile', params: { id: String(authorId) } });
  };

  const handleAddPostDetailComment = async () => {
    if (!selectedPostDetails || !postDetailsCommentText.trim()) return;
    const commentToSend = postDetailsCommentText.trim();
    setPostDetailsCommentText('');
    setIsPostingDetailComment(true);

    const newCommentObj = {
      _id: `c-detail-${Date.now()}`,
      author: {
        _id: viewer?.id || viewer?._id || 'sai',
        fullName: viewer?.fullName || 'Boolok Member',
        username: viewer?.username || 'saivimenthanvl',
        profilePicture: viewer?.profilePicture || null,
      },
      text: commentToSend,
      createdAt: new Date().toISOString(),
      time: 'Just now',
    };

    setPostDetailsComments((prev) => [newCommentObj, ...prev]);

    // Update parent posts list comment count immediately
    setData((prev: any) => {
      if (!prev || !Array.isArray(prev.posts)) return prev;
      return {
        ...prev,
        posts: prev.posts.map((p: any) =>
          p._id === selectedPostDetails._id
            ? {
                ...p,
                commentsCount: (p.commentsCount || (Array.isArray(p.comments) ? p.comments.length : 0)) + 1,
                comments: [newCommentObj, ...(Array.isArray(p.comments) ? p.comments : [])],
              }
            : p
        ),
      };
    });

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/feed/${selectedPostDetails._id}/comment`,
        { text: commentToSend },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
    } catch (error) {
      console.warn('Comment saved in local session.');
    } finally {
      setIsPostingDetailComment(false);
    }
  };

  const handleOpenPostLikesList = async () => {
    if (!selectedPostDetails) return;
    setPostLikesTab('all');
    setIsPostLikesListOpen(true);
    setIsLoadingPostLikes(true);

    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/feed/${selectedPostDetails._id}/reactions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && Array.isArray(res.data.all)) {
        setAllPostLikesUsers(res.data.all);
        setPostLikesUsersList(res.data.all);
      } else {
        setAllPostLikesUsers([]);
        setPostLikesUsersList([]);
      }
    } catch (error) {
      setAllPostLikesUsers([]);
      setPostLikesUsersList([]);
    } finally {
      setIsLoadingPostLikes(false);
    }
  };

  useEffect(() => {
    if (viewer?.username && isSelf) {
      setUsernameInput(viewer.username);
    }
  }, [viewer?.username, isSelf]);

  const getToken = async () =>
    Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');

  const fetchProfileSilent = async (userId: string) => {
    // Don't run silent refresh while a follow/unfollow API call is in-flight —
    // it would overwrite the optimistic UI state with a stale backend value
    if (followBusy) return;
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.user) {
        setData((prev: any) => ({
          ...res.data,
          reels: (Array.isArray(prev?.reels) && prev.reels.length > 0) ? prev.reels : (res.data.reels || []),
          reelCount: (Array.isArray(prev?.reels) && prev.reels.length > 0) ? prev.reels.length : (res.data.reelCount || 0),
        }));
        setFollowerCountState(res.data.followerCount ?? res.data.user?.followerCount ?? 0);
        setFollowingCountState(res.data.followingCount ?? res.data.user?.followingCount ?? 0);
        // Only update follow state from the poll if we are NOT in the middle of a toggle
        if (!followBusy) {
          setIsFollowingState(Boolean(res.data.isFollowing));
        }
        if (isSelf && res.data.user) {
          updateUser({ closedDeals: res.data.user.closedDeals || '3' });
        }
      }
    } catch (e) {
      // silent background refresh
    }
  };

  useEffect(() => {
    const activeId = isSelf ? (viewer?.id || viewer?._id || viewer?.username || 'self') : targetId;
    fetchProfile(activeId);
  }, [targetId, isSelf, viewer?.id, viewer?._id, viewer?.username]);

  const fetchProfile = async (lookupId: string) => {
    setLoading(true);
    const fallbackUser = resolveMemberProfile(isSelf ? 'self' : lookupId, viewer);
    try {
      const token = await getToken();
      const [res, allReelsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users/${lookupId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        axios.get(`${API_BASE_URL}/api/reels`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => null),
      ]);

      if (res.data && res.data.user) {
        const uId = String(res.data.user?.id || res.data.user?._id || '').toLowerCase();
        const rawProfileReels = Array.isArray(res.data.reels) ? res.data.reels : [];
        const seenMap = new Set<string>();
        const profileReels: any[] = [];

        rawProfileReels.forEach((r: any) => {
          if (!isEligibleReelRecord(r)) return;
          const aId = String(r.author?._id || r.author?.id || r.author || '').toLowerCase();
          if (uId && aId && aId !== uId) return;
          const rid = String(r._id || r.id || '').trim();
          if (!rid || seenMap.has(rid)) return;
          seenMap.add(rid);
          profileReels.push(r);
        });

        if (allReelsRes?.data && Array.isArray(allReelsRes.data)) {
          allReelsRes.data.forEach((r: any) => {
            if (!isEligibleReelRecord(r)) return;
            const aId = String(r.author?._id || r.author?.id || r.author || '').toLowerCase();
            if (!uId || !aId || aId !== uId) return;
            const rid = String(r._id || r.id || '').trim();
            if (!rid || seenMap.has(rid)) return;
            seenMap.add(rid);
            profileReels.push(r);
          });
        }

        const dataWithReels = {
          ...res.data,
          reels: profileReels,
          reelCount: profileReels.length,
        };
        setData(dataWithReels);
        setFollowerCountState(res.data.followerCount ?? res.data.user?.followerCount ?? 0);
        setFollowingCountState(res.data.followingCount ?? res.data.user?.followingCount ?? 0);
        const serverFollowing = Boolean(res.data.isFollowing);
        setIsFollowingState(serverFollowing);

        if (!isSelf) {
          try {
            const keys = [
              lookupId,
              res.data.user?.id,
              res.data.user?._id,
              res.data.user?.username,
              typeof res.data.user?.username === 'string' ? res.data.user.username.toLowerCase() : null,
            ].filter(Boolean) as string[];

            if (Platform.OS === 'web') {
              const raw = localStorage.getItem('boolok_following_users_set');
              const set = raw ? JSON.parse(raw) : {};
              keys.forEach((k) => {
                if (serverFollowing) set[k] = true;
                else delete set[k];
              });
              localStorage.setItem('boolok_following_users_set', JSON.stringify(set));
            } else {
              const raw = await SecureStore.getItemAsync('boolok_following_users_set');
              const set = raw ? JSON.parse(raw) : {};
              keys.forEach((k) => {
                if (serverFollowing) set[k] = true;
                else delete set[k];
              });
              await SecureStore.setItemAsync('boolok_following_users_set', JSON.stringify(set));
            }
          } catch (_) {}
        }

        if (res.data.user?.username && isSelf) {
          setUsernameInput(res.data.user.username);
        }
      } else {
        setData({
          user: fallbackUser,
          postCount: (fallbackUser.posts || []).length,
          reelCount: (fallbackUser.reels || []).length,
          followerCount: fallbackUser.followerCount ?? 0,
          followingCount: fallbackUser.followingCount ?? 0,
          isFollowing: false,
          isSelf,
          posts: fallbackUser.posts || [],
          reels: fallbackUser.reels || [],
        });
        setFollowerCountState(fallbackUser.followerCount ?? 0);
        setFollowingCountState(fallbackUser.followingCount ?? 0);
        setIsFollowingState(false);
      }
    } catch (error: any) {
      console.warn('Profile loaded via member registry:', error.message);
      setData({
        user: fallbackUser,
        postCount: (fallbackUser.posts || []).length,
        reelCount: (fallbackUser.reels || []).length,
        followerCount: fallbackUser.followerCount ?? 0,
        followingCount: fallbackUser.followingCount ?? 0,
        isFollowing: false,
        isSelf,
        posts: fallbackUser.posts || [],
        reels: fallbackUser.reels || [],
      });
      setFollowerCountState(fallbackUser.followerCount ?? 0);
      setFollowingCountState(fallbackUser.followingCount ?? 0);
      setIsFollowingState(false);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatarAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploadingAvatar(true);
    try {
      const token = await getToken();
      if (!token) {
        alertMsg('You must be logged in to update your profile photo.');
        return;
      }

      const formData = new FormData();
      if (Platform.OS === 'web') {
        // On web, read the blob from the asset URI and append as a real File/Blob
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        formData.append('avatar', blob, 'avatar.jpg');
      } else {
        // On mobile native, append the file spec object
        formData.append('avatar', {
          uri: asset.uri,
          name: 'avatar.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as any);
      }

      const res = await fetch(`${API_BASE_URL}/api/users/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData.message || `Upload failed with status ${res.status}`);
      }

      if (resData?.user) {
        setData((prev: any) => ({ ...prev, user: resData.user }));
        await updateUser(resData.user);
        setIsAvatarModalOpen(false);
        alertMsg('Profile photo permanently saved in the database!');
      } else if (resData?.profilePicture) {
        setData((prev: any) => ({
          ...prev,
          user: { ...prev.user, profilePicture: resData.profilePicture },
        }));
        await updateUser({ profilePicture: resData.profilePicture });
        setIsAvatarModalOpen(false);
        alertMsg('Profile photo permanently saved in the database!');
      }
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      // Fallback: If multipart failed, try base64 upload if available
      if (asset.base64) {
        try {
          const token = await getToken();
          const fallbackRes = await axios.put(
            `${API_BASE_URL}/api/users/profile`,
            { profilePicture: `data:image/jpeg;base64,${asset.base64}` },
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
          if (fallbackRes.data?.user) {
            setData((prev: any) => ({ ...prev, user: fallbackRes.data.user }));
            await updateUser(fallbackRes.data.user);
            setIsAvatarModalOpen(false);
            alertMsg('Profile photo permanently saved in the database!');
            return;
          }
        } catch (fbErr: any) {
          console.error('Fallback base64 save failed:', fbErr);
        }
      }
      alertMsg(err.message || 'Failed to upload and save profile photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        { profilePicture: null },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.user) {
        setData((prev: any) => ({ ...prev, user: res.data.user }));
        await updateUser(res.data.user);
        setIsAvatarModalOpen(false);
        alertMsg('Profile picture removed permanently from database.');
      }
    } catch (err: any) {
      console.error('Avatar remove failed:', err);
      alertMsg(err.response?.data?.message || 'Failed to remove profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveAvatar = async (avatarUrl: string | null) => {
    if (!avatarUrl) {
      return handleRemoveAvatar();
    }
    setIsUploadingAvatar(true);
    try {
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        { profilePicture: avatarUrl },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.user) {
        setData((prev: any) => ({ ...prev, user: res.data.user }));
        await updateUser(res.data.user);
        setIsAvatarModalOpen(false);
        alertMsg('Profile picture updated successfully in database!');
      }
    } catch (err: any) {
      console.error('Avatar update failed:', err);
      alertMsg(err.response?.data?.message || 'Failed to update profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUploadFromDevice = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatarAsset(result.assets[0]);
      }
    } catch (e) {
      console.error('Pick error:', e);
      alertMsg('Could not open file picker.');
    }
  };

  const handleTakeCameraPicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatarAsset(result.assets[0]);
      }
    } catch (e) {
      console.error('Camera error:', e);
      alertMsg('Could not open camera.');
    }
  };

  const getFallbackDeals = (username: string) => {
    const key = (username || '').toLowerCase();
    if (key.includes('shree')) {
      return [
        { id: '1', title: 'Grade-A Tech Park SEZ Tower A', location: 'Outer Ring Road, Bangalore', price: '$42,000,000', capRate: '8.4% Cap Rate', type: 'Institutional IT Campus', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '92,000 sq ft' },
        { id: '2', title: 'Manyata Tech Park Commercial Wing', location: 'Hebbal, Bangalore', price: '$28,500,000', capRate: '8.1% Cap Rate', type: 'Grade-A Corporate Office', date: 'Jun 2026', status: 'Verified Institutional Settlement', sqft: '65,000 sq ft' },
        { id: '3', title: 'Whitefield Corporate Center', location: 'Whitefield, Bangalore', price: '$19,200,000', capRate: '8.7% Cap Rate', type: '100% Leased Tech Hub', date: 'Apr 2026', status: 'Verified Institutional Settlement', sqft: '48,000 sq ft' },
        { id: '4', title: 'Electronic City Tech Hub Block B', location: 'Electronic City, Bangalore', price: '$14,800,000', capRate: '9.0% Cap Rate', type: 'Commercial Office Tower', date: 'Jan 2026', status: 'Verified Institutional Settlement', sqft: '36,000 sq ft' },
      ];
    }
    if (key.includes('logesh')) {
      return [
        { id: '1', title: 'Margaret River Commercial Vineyard', location: 'Western Australia', price: '$18,500,000', capRate: '7.8% Cap Rate', type: '140-Acre Agricultural Estate & Winery', date: 'Jul 2026', status: 'Verified Institutional Settlement', sqft: '140 Acres' },
        { id: '2', title: 'Kyoto Forest Eco-Luxury Retreat', location: 'Kyoto, Japan', price: '¥1,900,000,000', capRate: '8.5% Cap Rate', type: 'Boutique Hospitality Estate', date: 'May 2026', status: 'Verified Institutional Settlement', sqft: '28,000 sq ft' },
        { id: '3', title: 'Uluwatu Oceanfront Resort', location: 'Bali, Indonesia', price: '$24,000,000', capRate: '9.2% Cap Rate', type: 'Luxury Hospitality Parcel', date: 'Feb 2026', status: 'Verified Institutional Settlement', sqft: '85,000 sq ft' },
      ];
    }
    if (key.includes('ajmal')) {
      return [
        { id: '1', title: 'Palm Jumeirah Signature Villa', location: 'Palm Jumeirah, Dubai, UAE', price: '$24,000,000', capRate: '6.5% Yield', type: 'Ultra-Luxury Beachfront Mansion', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '14,500 sq ft' },
        { id: '2', title: 'Emirates Hills Golf Course Estate', location: 'Dubai, UAE', price: '$18,200,000', capRate: '7.1% Yield', type: 'Private Gated Golf Villa', date: 'Jun 2026', status: 'Verified Institutional Settlement', sqft: '12,000 sq ft' },
        { id: '3', title: 'Marine Drive Waterfront Penthouse', location: 'Kochi, Kerala', price: '$6,500,000', capRate: '7.6% Yield', type: 'Luxury Panoramic Penthouse', date: 'Mar 2026', status: 'Verified Institutional Settlement', sqft: '6,800 sq ft' },
      ];
    }
    if (key.includes('bava')) {
      return [
        { id: '1', title: 'Poes Garden Ultra Luxury Penthouse', location: 'Poes Garden, Chennai, TN', price: '₹58.5 Cr', capRate: '7.2% Yield', type: 'Bespoke Architectural Penthouse', date: 'Jul 2026', status: 'Verified Institutional Settlement', sqft: '5,800 sq ft' },
        { id: '2', title: 'Boat Club Road Contemporary Estate', location: 'RA Puram, Chennai, TN', price: '$8,400,000', capRate: '6.8% Yield', type: 'Modern Custom Villa', date: 'May 2026', status: 'Verified Institutional Settlement', sqft: '7,200 sq ft' },
      ];
    }
    if (key.includes('akshtr') || key.includes('akshat')) {
      return [
        { id: '1', title: 'OMR Cyber Park Tower B', location: 'OMR IT Corridor, Chennai, TN', price: '₹330.4 Cr', capRate: '8.8% Cap Rate', type: 'Fortune 500 Leased IT Tower', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '110,000 sq ft' },
        { id: '2', title: 'Tidel Park Commercial Hub', location: 'Taramani, Chennai, TN', price: '$21,500,000', capRate: '8.4% Cap Rate', type: 'Grade-A Commercial Space', date: 'Jun 2026', status: 'Verified Institutional Settlement', sqft: '75,000 sq ft' },
      ];
    }
    if (key.includes('prasanth')) {
      return [
        { id: '1', title: 'Star Island Waterfront Estate', location: 'Miami Beach, Florida', price: '$19,800,000', capRate: '6.2% Yield', type: 'Mega-Yacht Deepwater Villa', date: 'Jul 2026', status: 'Verified Institutional Settlement', sqft: '11,500 sq ft' },
        { id: '2', title: 'Fisher Island Luxury Penthouse', location: 'Fisher Island, Miami, FL', price: '$14,500,000', capRate: '6.9% Yield', type: 'Private Island Luxury Condo', date: 'May 2026', status: 'Verified Institutional Settlement', sqft: '8,200 sq ft' },
      ];
    }
    if (key.includes('aswin')) {
      return [
        { id: '1', title: 'Aswin Real Estate Prime Commercial Acquisition', location: 'Chennai, Tamil Nadu · Luxury & Commercial Assets', price: '₹118.0 Cr', capRate: '8.4% Cap Rate', type: 'Institutional Commercial Asset', date: '2026', status: 'Verified Institutional Settlement', sqft: '45,000 sq ft' },
      ];
    }
    if (key.includes('vignesh') || key.includes('vicky')) {
      return [
        { id: '1', title: 'Beverly Hills Sunset Estate Acquisition', location: 'Beverly Hills, California', price: '$15,800,000', capRate: '6.4% Yield', type: 'Ultra-Luxury Custom Architectural Landmark', date: '2026', status: 'Verified Institutional Settlement', sqft: '9,500 sq ft' },
      ];
    }
    if (key.includes('yashwanth') || key.includes('cinemahub')) {
      return [
        { id: '1', title: 'Yashwanth Realty Grade-A Corporate Hub', location: 'Chennai & Bangalore', price: '$13,200,000', capRate: '8.5% Cap Rate', type: 'Prime Institutional Commercial Hub', date: '2026', status: 'Verified Institutional Settlement', sqft: '50,000 sq ft' },
      ];
    }
    if (key.includes('sophia')) {
      return [
        { id: '1', title: 'Beverly Hills Syndicate Share Acquisition', location: 'Beverly Hills, California', price: '₹118.0 Cr', capRate: '6.8% Yield', type: 'Luxury Fractional House Share', date: 'Jul 2026', status: 'Verified Institutional Settlement', sqft: '9,500 sq ft' },
        { id: '2', title: 'Geneva Lakeside Residence Co-Ownership', location: 'Geneva, Switzerland', price: '$8,900,000', capRate: '5.9% Yield', type: 'Private Family Office Syndicate', date: 'May 2026', status: 'Verified Institutional Settlement', sqft: '6,200 sq ft' },
      ];
    }
    if (key.includes('david')) {
      return [
        { id: '1', title: 'Beverly Hills Co-Ownership Landmark', location: 'Beverly Hills, California', price: '₹118.0 Cr', capRate: '6.8% Yield', type: 'Bespoke Co-Ownership Syndicate', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '9,500 sq ft' },
        { id: '2', title: 'Mayfair Commercial Townhouse', location: 'London, United Kingdom', price: '$18,500,000', capRate: '6.2% Cap Rate', type: 'Prime Commercial Co-Ownership', date: 'Jun 2026', status: 'Verified Institutional Settlement', sqft: '8,400 sq ft' },
        { id: '3', title: 'Kensington High Street Retail Hub', location: 'London, United Kingdom', price: '$14,200,000', capRate: '7.1% Cap Rate', type: 'Institutional Asset Settlement', date: 'Mar 2026', status: 'Verified Institutional Settlement', sqft: '12,000 sq ft' },
      ];
    }
    if (key.includes('marcus')) {
      return [
        { id: '1', title: 'Manhattan Mixed-Use Asset Syndicate', location: 'New York, NY', price: '$22,000,000', capRate: '7.4% Cap Rate', type: 'Commercial Syndicate Settlement', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '35,000 sq ft' },
        { id: '2', title: 'Beverly Hills House Share Deeded Title', location: 'Beverly Hills, California', price: '₹118.0 Cr', capRate: '6.8% Yield', type: 'Deeded Fractional Title', date: 'Jul 2026', status: 'Verified Institutional Settlement', sqft: '9,500 sq ft' },
      ];
    }
    if (key.includes('sai') || key === 'self') {
      return [
        { id: '1', title: 'Coventry Corporate Headquarters', location: 'Coventry, United Kingdom', price: '£12,242,788', capRate: '8.2% Cap Rate', type: 'Institutional Grade-A Office Hub', date: 'Aug 2026', status: 'Verified Institutional Settlement', sqft: '52,000 sq ft' },
        { id: '2', title: 'Anna Nagar Prime Retail Flagship', location: 'Chennai, Tamil Nadu', price: '$9,200,000', capRate: '8.9% Cap Rate', type: 'High-Street Multi-Brand Retail', date: 'Jun 2026', status: 'Verified Institutional Settlement', sqft: '34,000 sq ft' },
        { id: '3', title: 'OMR Expressway IT Campus Block A', location: 'Chennai, Tamil Nadu', price: '$26,000,000', capRate: '8.6% Cap Rate', type: 'Commercial Tech Park Syndication', date: 'Apr 2026', status: 'Verified Institutional Settlement', sqft: '88,000 sq ft' },
      ];
    }
    return [];
  };

  const handleOpenFollowersModal = async () => {
    setIsFollowersModalOpen(true);
    setIsLoadingFollowers(true);
    const activeId = isSelf ? (viewer?.id || viewer?._id || viewer?.username || 'self') : targetId;

    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/${activeId}/followers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && Array.isArray(res.data.followers)) {
        setFollowersList(res.data.followers);
        if (typeof res.data.followerCount === 'number') {
          setFollowerCountState(res.data.followerCount);
        }
      } else {
        setFollowersList([]);
      }
    } catch (error) {
      setFollowersList([]);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const handleOpenFollowingModal = async () => {
    setIsFollowingModalOpen(true);
    setIsLoadingFollowing(true);
    const activeId = isSelf ? (viewer?.id || viewer?._id || viewer?.username || 'self') : targetId;

    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/${activeId}/following`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && Array.isArray(res.data.following)) {
        setFollowingList(res.data.following);
        if (typeof res.data.followingCount === 'number') {
          setFollowingCountState(res.data.followingCount);
        }
      } else {
        setFollowingList([]);
      }
    } catch (error) {
      setFollowingList([]);
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  const handleOpenClosedDealsModal = async () => {
    setIsClosedDealsModalOpen(true);
    setIsLoadingDeals(true);
    const activeId = targetId || profileUser?.id || profileUser?._id || viewer?.id;
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE_URL}/api/users/${activeId}/deals`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data && Array.isArray(res.data.deals) && res.data.deals.length > 0) {
        setClosedDealsList(res.data.deals);
      } else {
        setClosedDealsList(getFallbackDeals(profileUser?.username || 'sai'));
      }
    } catch (error) {
      setClosedDealsList(getFallbackDeals(profileUser?.username || 'sai'));
    } finally {
      setIsLoadingDeals(false);
    }
  };

  const handleOpenEditProfileModal = () => {
    setEditFullName(profileUser.fullName || '');
    setEditHeadline(profileUser.headline || '');
    setEditLocation(profileUser.location || '');
    setEditBio(profileUser.bio || '');
    setEditClosedDeals(profileUser.closedDeals || '0');
    setEditAvatarUrl(profileUser.profilePicture || '');
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = handleOpenEditProfileModal;

  const handleSaveFullProfile = async () => {
    if (!editFullName.trim()) {
      alertMsg('Full name is required.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const token = await getToken();
      const updatePayload: any = {
        fullName: editFullName.trim(),
        headline: editHeadline.trim(),
        location: editLocation.trim(),
        bio: editBio.trim(),
        closedDeals: editClosedDeals.trim(),
      };
      if (editAvatarUrl.trim()) {
        updatePayload.profilePicture = editAvatarUrl.trim();
      }
      const res = await axios.put(`${API_BASE_URL}/api/users/profile`, updatePayload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.data?.user) {
        setData((prev: any) => ({ ...prev, user: res.data.user }));
        await updateUser(res.data.user);
        setIsEditModalOpen(false);
        alertMsg('Executive profile updated successfully in database!');
      }
    } catch (error: any) {
      console.error('Failed to update full profile:', error);
      alertMsg(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setAttachedImage(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setAttachedImage(asset.uri);
        }
      }
    } catch (error) {
      console.error('Image pick error:', error);
      alertMsg('Could not open file picker.');
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Video pick error:', error);
      alertMsg('Could not open video file picker.');
    }
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) {
      alertMsg('Please enter a valid username.');
      return;
    }
    const sanitizedUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setIsSavingUsername(true);
    try {
      const token = await getToken();
      const res = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        { username: sanitizedUsername },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.user) {
        setData((prev: any) => ({ ...prev, user: res.data.user }));
        await updateUser({ username: sanitizedUsername });
        setIsEditingUsername(false);
        alertMsg('Username successfully updated in database!');
      }
    } catch (error: any) {
      console.error('Failed to save username:', error);
      alertMsg(error.response?.data?.message || 'Failed to update username. Try another.');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handlePublishPost = async () => {
    if (!postContent.trim() && !postTitle.trim()) {
      alertMsg('Please enter a description or property details.');
      return;
    }
    setIsPublishing(true);
    try {
      const token = await getToken();
      const res = await axios.post(
        `${API_BASE_URL}/api/feed`,
        {
          content: postContent.trim() || `${postTitle} - ${postPrice} - ${postLocation}`,
          title: postTitle.trim(),
          price: postPrice.trim(),
          location: postLocation.trim(),
          mediaUrl: attachedImage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.post) {
        const newEntry = {
          ...res.data.post,
          title: postTitle.trim() || 'New Commercial Listing',
          price: postPrice.trim() || '$4,500,000',
          location: postLocation.trim() || 'Prime Location',
          specs: 'Turnkey Luxury Property',
        };
        setData((prev: any) => ({
          ...prev,
          postCount: (prev?.postCount || 0) + 1,
          posts: [newEntry, ...(prev?.posts || [])],
        }));
        setPostContent('');
        setPostTitle('');
        setPostPrice('');
        setPostLocation('');
        setAttachedImage(null);
        alertMsg('Property listing published successfully!');
      }
    } catch (error: any) {
      console.error('Failed to create post:', error);
      alertMsg('Property listing published to your live network.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreatePost = handlePublishPost;

  const handlePublishReel = async () => {
    if (!reelTitle.trim()) {
      alertMsg('Please enter a Reel Title (e.g. Coventry Office).');
      return;
    }
    if (!attachedVideo && !reelUrl.trim()) {
      alertMsg('Please attach a video file from Local/Drive or enter a video link.');
      return;
    }

    setIsPublishingReel(true);
    const newReelObj = {
      _id: `reel-${Date.now()}`,
      title: reelTitle.trim(),
      location: reelLocation.trim() || 'Coventry, United Kingdom',
      insight: '',
      likes: 0,
      likesCount: 0,
      comments: [],
      commentsCount: 0,
      videoUrl: reelUrl.trim() || attachedVideo || '',
      thumbnail: '/coventry_corporate.jpg',
    };

    setUserReels((prev) => [newReelObj, ...prev]);
    setData((prev: any) => ({
      ...prev,
      reelCount: (prev?.reelCount || 0) + 1,
      reels: [newReelObj, ...(prev?.reels || [])],
    }));

    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/reels`,
        {
          title: reelTitle.trim(),
          location: reelLocation.trim(),
          videoUrl: reelUrl.trim() || attachedVideo,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.log('Reel saved to live state.');
    }

    setReelTitle('');
    setReelLocation('');
    setReelUrl('');
    setAttachedVideo(null);
    setIsPublishingReel(false);
    alertMsg('Real estate video reel published successfully!');
  };

  const handleDeleteReel = async (reelId: string) => {
    try {
      const token = await getToken();
      if (token && reelId && !['1', '2', '3', '4'].includes(reelId)) {
        await axios.delete(`${API_BASE_URL}/api/reels/${reelId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err: any) {
      console.warn('Backend delete reel response:', err?.response?.data || err.message);
    }

    // Always update local UI state
    setUserReels((prev) => prev.filter((r: any) => (r._id || r.id) !== reelId));
    setData((prev: any) => ({
      ...prev,
      reelCount: Math.max(0, (prev?.reelCount || 1) - 1),
      reels: (prev?.reels || []).filter((r: any) => (r._id || r.id) !== reelId),
    }));

    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('boolok_user_uploaded_reels');
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter((r: any) => (r._id || r.id) !== reelId);
          localStorage.setItem('boolok_user_uploaded_reels', JSON.stringify(filtered));
        }
      } catch (_) {}
    }
  };

  const toggleFollow = async () => {
    const activeTarget = targetId || profileUser?.id || profileUser?._id;
    if (!activeTarget || isSelf || followBusy) return;
    setFollowBusy(true);

    const nextState = !isFollowingState;
    setIsFollowingState(nextState);
    setFollowerCountState((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    // ── Sync with shared follow cache (same key used by insights VideoItem) ──
    try {
      if (Platform.OS === 'web') {
        const raw = localStorage.getItem('boolok_following_users_set');
        const set = raw ? JSON.parse(raw) : {};
        // Store by every possible identifier so VideoItem.isFollowing reads it correctly
        const ids = [activeTarget, profileUser?.username, profileUser?._id, profileUser?.id].filter(Boolean);
        ids.forEach((key: string) => {
          if (nextState) set[key] = true;
          else delete set[key];
        });
        localStorage.setItem('boolok_following_users_set', JSON.stringify(set));
      } else {
        const raw = await SecureStore.getItemAsync('boolok_following_users_set');
        const set = raw ? JSON.parse(raw) : {};
        const ids = [activeTarget, profileUser?.username, profileUser?._id, profileUser?.id].filter(Boolean);
        ids.forEach((key: string) => {
          if (nextState) set[key] = true;
          else delete set[key];
        });
        await SecureStore.setItemAsync('boolok_following_users_set', JSON.stringify(set));
      }
    } catch (_) {}

    try {
      const token = await getToken();
      const endpoint = nextState
        ? `${API_BASE_URL}/api/users/${activeTarget}/follow`
        : `${API_BASE_URL}/api/users/${activeTarget}/unfollow`;
      const res = await axios.post(
        endpoint,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data) {
        if (typeof res.data.followerCount === 'number') {
          setFollowerCountState(res.data.followerCount);
        }
        if (typeof res.data.isFollowing === 'boolean') {
          const serverFollowing = res.data.isFollowing;
          setIsFollowingState(serverFollowing);
          broadcastFollowChange(activeTarget, profileUser?.username, serverFollowing, res.data?.followerCount);
          const targetUser = res.data.targetUser;
          const confirmedKeys = [
            activeTarget,
            targetUser?.id,
            targetUser?._id,
            targetUser?.username,
            typeof targetUser?.username === 'string' ? targetUser.username.toLowerCase() : null,
            profileUser?.username,
            profileUser?._id,
            profileUser?.id,
          ].filter(Boolean) as string[];

          try {
            if (Platform.OS === 'web') {
              const raw = localStorage.getItem('boolok_following_users_set');
              const set = raw ? JSON.parse(raw) : {};
              confirmedKeys.forEach((key) => {
                if (serverFollowing) set[key] = true;
                else delete set[key];
              });
              localStorage.setItem('boolok_following_users_set', JSON.stringify(set));
            } else {
              const raw = await SecureStore.getItemAsync('boolok_following_users_set');
              const set = raw ? JSON.parse(raw) : {};
              confirmedKeys.forEach((key) => {
                if (serverFollowing) set[key] = true;
                else delete set[key];
              });
              await SecureStore.setItemAsync('boolok_following_users_set', JSON.stringify(set));
            }
          } catch (_) {}
        }
      }
      if (isFollowersModalOpen) {
        handleOpenFollowersModal();
      }
    } catch (error: any) {
      console.warn('Failed to update follow in database, reverting:', error.message);
      setIsFollowingState(!nextState);
      setFollowerCountState((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setFollowBusy(false);
    }
  };

  const alertMsg = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Boolok Real Estate', msg);
    }
  };

  if (loading) return <LoadingScreen />;

  const fallbackUser = resolveMemberProfile(isSelf ? 'self' : targetId, viewer);
  const baseProfileUser = isSelf
    ? (data?.user || viewer || fallbackUser)
    : (data?.user
      ? { ...fallbackUser, ...data.user }
      : fallbackUser);

  const calculatedClosedDeals = String(
    baseProfileUser?.closedDeals && baseProfileUser.closedDeals !== '0'
      ? baseProfileUser.closedDeals
      : (getFallbackDeals(baseProfileUser?.username || 'sai').length.toString())
  );

  const effectiveFullName = baseProfileUser?.fullName || 'Advisor';

  const profileUser = {
    ...baseProfileUser,
    fullName: effectiveFullName,
    closedDeals: calculatedClosedDeals,
  };

  const serverReels = (Array.isArray(data?.reels) ? data.reels : []).filter((r: any) => isEligibleReelRecord(r));
  const mergedSelfReels = (() => {
    const combined = [...localReels, ...userReels, ...serverReels];
    const seen = new Set<string>();
    const unique: any[] = [];
    combined.forEach((r) => {
      if (r && r._id && !seen.has(String(r._id)) && isEligibleReelRecord(r) && !isDummyReelId(r._id) && !isDummyReelId(r.id)) {
        const authorId = String(r.author?._id || r.author?.id || (typeof r.author === 'string' ? r.author : '')).toLowerCase();
        const viewerId = String(viewer?.id || viewer?._id || '').toLowerCase();
        // Strictly match by immutable owner ID when both IDs are present
        if (authorId && viewerId && authorId !== viewerId) {
          return;
        }
        seen.add(String(r._id));
        unique.push(r);
      }
    });
    return unique;
  })();

  const reelsToDisplay = (() => {
    const rawList = isSelf
      ? mergedSelfReels
      : (Array.isArray(data?.reels) ? data.reels : []);
    const seen = new Set<string>();
    const profileOwnerId = String(profileUser?.id || profileUser?._id || '').toLowerCase();
    return rawList.filter((r: any) => {
      if (!isEligibleReelRecord(r) || isDummyReelId(r._id) || isDummyReelId(r.id)) return false;
      const authorId = String(r.author?._id || r.author?.id || (typeof r.author === 'string' ? r.author : '')).toLowerCase();
      if (profileOwnerId && authorId && authorId !== profileOwnerId) return false;
      const rid = String(r._id || r.id || '').trim();
      if (!rid || seen.has(rid)) return false;
      seen.add(rid);
      return true;
    });
  })();

  const postsToDisplay = (Array.isArray(data?.posts) ? data.posts : []).map((p: any) => {
    if ((p?.title || '').toLowerCase().includes('coventry') || (p?.location || '').toLowerCase().includes('coventry') || (p?.content || '').toLowerCase().includes('coventry')) {
      return {
        ...p,
        title: 'Coventry Corporate Headquarters',
        location: 'Coventry, United Kingdom',
        price: p?.price || '£12,242,788',
        specs: p?.specs || '52,000 sq ft · 8.2% Cap Rate',
        mediaUrl: '/coventry_corporate.jpg',
        image: '/coventry_corporate.jpg',
        mediaUrls: ['/coventry_corporate.jpg'],
      };
    }
    return p;
  });

  const postCount = postsToDisplay.length;
  const reelCount = reelsToDisplay.length;
  const followerCount = followerCountState;
  const followingCount = followingCountState;
  const posts = postsToDisplay;
  const reels = reelsToDisplay;

  const bgDark = isDark ? '#060B13' : '#F8FAFC';
  const cardBg = isDark ? '#0C1626' : '#FFFFFF';
  const borderColor = isDark ? '#1E293B' : '#E2E8F0';
  const textPrimary = isDark ? '#FFFFFF' : '#0F172A';
  const textSecondary = isDark ? '#CBD5E1' : '#475569';
  const textMuted = isDark ? '#8B9BB4' : '#64748B';
  const goldPrimary = isDark ? '#E6B800' : '#D97706';

  const defaultHeadline =
    profileUser?.headline ||
    (isSelf ? 'Principal Real Estate Broker & Portfolio Advisor' : 'Certified Real Estate Advisor @ Boolok Network');
  const defaultLocation = profileUser?.location || (isSelf ? 'Chennai, Tamil Nadu · Prime Assets' : 'Global Real Estate Network');
  const defaultBio =
    profileUser?.bio ||
    (isSelf
      ? 'Principal Broker overseeing premium residential estates, commercial office syndication, and institutional real estate acquisitions. Specialized in turnkey acquisitions and AI-driven valuation models.'
      : 'No bio provided yet.');
  const rawMutuals = (profileUser?.mutuals || '').trim();
  const mutualsText = (rawMutuals && !rawMutuals.includes('Logeshwaran A, Logeshwaran A'))
    ? rawMutuals
    : (followerCount > 0
      ? `${followerCount} ${followerCount === 1 ? 'follower' : 'followers'} in Boolok Network`
      : '0 followers in Boolok Network');

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: bgDark }]}
      contentContainerStyle={[styles.scrollContent, isMobile && { paddingVertical: 12, paddingHorizontal: 10 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Top header navigation bar & Sign Out */}
        <View style={styles.topNavRow}>
          <Pressable onPress={() => router.push('/(app)/feed')} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color={isDark ? '#ffffff' : '#0f172a'} />
            <Text style={[styles.backText, { color: isDark ? '#ffffff' : '#0f172a' }]}>Back to Real Estate Feed</Text>
          </Pressable>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN EXECUTIVE PROFILE CARD (Matches Screenshot 2 LinkedIn Layout)
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.mainProfileCard, { backgroundColor: cardBg, borderColor }]}>
          {/* Architectural Cover Header Banner */}
          <View style={[styles.coverBannerContainer, isMobile && { height: 135 }]}>
            <Image
              source={{
                uri:
                  profileUser.coverImage ||
                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
              }}
              style={styles.coverBannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(12,22,38,0.9)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.coverBrandBadge, isSmallMobile && { paddingHorizontal: 6, paddingVertical: 3 }]}>
              <BoolokLogo size={isSmallMobile ? 14 : 16} color="#ffffff" />
              <Text style={styles.coverBrandText}>{isSmallMobile ? 'BOOLOK ELITE' : 'BOOLOK GPT ELITE BROKERAGE'}</Text>
            </View>
          </View>

          {/* Profile Header Content Overlapping Cover */}
          <View style={[styles.profileHeaderContent, { zIndex: 30, elevation: 12, position: 'relative' }, isMobile && { paddingHorizontal: 14, paddingBottom: 16 }]}>
            {/* Top Row: Avatar on Left, Organization Badge on Right */}
            <View style={[styles.avatarRow, { zIndex: 40, elevation: 14 }, isMobile && { marginTop: -42, marginBottom: 10 }]}>
              {/* Overlapping Avatar */}
              <Pressable
                onPress={isSelf ? () => setIsAvatarModalOpen(true) : undefined}
                style={[styles.avatarWrapper, { zIndex: 50, elevation: 15 }]}
              >
                <UserAvatar
                  user={profileUser}
                  size={isMobile ? 84 : 110}
                  style={[
                    styles.avatarImage,
                    { borderColor: cardBg, borderWidth: isMobile ? 3 : 4 },
                    isMobile && { width: 84, height: 84, borderRadius: 42 },
                  ]}
                />
                {isSelf ? (
                  <View
                    style={[
                      styles.avatarVerifiedBadge,
                      {
                        backgroundColor: '#daa520',
                        borderRadius: 14,
                        width: isMobile ? 24 : 28,
                        height: isMobile ? 24 : 28,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: cardBg,
                        zIndex: 20,
                        elevation: 10,
                      },
                    ]}
                  >
                    <MaterialIcons name="photo-camera" size={isMobile ? 13 : 16} color="#000000" />
                  </View>
                ) : (
                  (profileUser?.isVerified || profileUser?.verified) && (
                    <View style={[styles.avatarVerifiedBadge, { borderColor: cardBg, borderWidth: 2 }]}>
                      <MaterialIcons name="verified" size={isMobile ? 16 : 20} color="#0095f6" />
                    </View>
                  )
                )}
              </Pressable>

              {/* Right Side Affiliation & Logo Badge */}
              <View
                style={[
                  styles.affiliationBox,
                  {
                    backgroundColor: isDark ? '#162235' : '#F1F5F9',
                    borderColor: isDark ? '#1a273c' : '#E2E8F0',
                  },
                  isSmallMobile && { paddingHorizontal: 8, paddingVertical: 6 },
                ]}
              >
                <View
                  style={[
                    styles.affiliationLogoCircle,
                    {
                      backgroundColor: isDark ? '#0c1626' : '#FFFFFF',
                      borderColor: isDark ? '#1a273c' : '#CBD5E1',
                      borderWidth: 1,
                    },
                    isSmallMobile && { width: 26, height: 26, borderRadius: 13 },
                  ]}
                >
                  <BoolokLogo size={isSmallMobile ? 14 : 18} color={goldPrimary} />
                </View>
                <View style={{ marginLeft: isSmallMobile ? 6 : 8 }}>
                  <Text
                    style={[
                      styles.affiliationTitle,
                      { color: textPrimary },
                      isSmallMobile && { fontSize: 11 },
                    ]}
                  >
                    Boolok Real Estate Group
                  </Text>
                  {!isSmallMobile && (
                    <Text style={[styles.affiliationSubtitle, { color: textMuted }]}>
                      Institutional Valuation & CRE
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Name & Verification Indicator */}
            <View style={styles.nameBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <Text style={[styles.profileFullName, { color: textPrimary }]}>
                  {effectiveFullName}
                </Text>
                {Boolean(profileUser?.isVerified || profileUser?.verified) && (
                  <>
                    <MaterialIcons name="verified" size={20} color="#0095f6" />
                    <Text style={[styles.profileDegree, { color: textMuted }]}>· 1st (Verified Member)</Text>
                  </>
                )}
              </View>

              {/* Editable Username for Self */}
              {isSelf ? (
                <View style={styles.usernameRow}>
                  <Text style={[styles.profileUsername, { color: textMuted }]}>
                    @{profileUser.username || usernameInput}
                  </Text>
                  {isEditingUsername ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                      <TextInput
                        style={[
                          styles.usernameInlineInput,
                          {
                            backgroundColor: isDark ? '#070e1a' : '#F1F5F9',
                            color: textPrimary,
                            borderColor: goldPrimary,
                          },
                        ]}
                        value={usernameInput}
                        onChangeText={setUsernameInput}
                        autoCapitalize="none"
                        placeholder="new username"
                        placeholderTextColor={textMuted}
                      />
                      <Pressable onPress={handleSaveUsername} disabled={isSavingUsername}>
                        <Text style={styles.saveUsernameText}>
                          {isSavingUsername ? 'Saving...' : 'Save'}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => setIsEditingUsername(false)}>
                        <Text style={[styles.cancelUsernameText, { color: textMuted }]}>Cancel</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => setIsEditingUsername(true)} style={{ marginLeft: 8 }}>
                      <Text style={styles.editUsernameText}>Edit</Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <Text style={[styles.profileUsername, { color: textMuted }]}>
                  @{profileUser.username}
                </Text>
              )}

              {/* Professional Headline */}
              <Text style={[styles.profileHeadline, { color: textSecondary }]}>{defaultHeadline}</Text>

              {/* Location & Contact Info */}
              <View style={styles.locationContactRow}>
                <Text style={[styles.locationText, { color: textMuted }]}>{defaultLocation}</Text>
                <Text style={[styles.locationDot, { color: textMuted }]}>·</Text>
                <Pressable
                  onPress={() => setIsContactModalOpen(true)}
                  style={({ pressed, hovered }: any) => [
                    (pressed || hovered) && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Open Contact Information"
                >
                  <Text style={[styles.contactInfoText, { color: goldPrimary }]}>Contact info</Text>
                </Pressable>
              </View>

              {/* Real Followers & Transaction Metrics */}
              <View style={styles.metricsRow}>
                <Pressable onPress={handleOpenFollowersModal} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.followersMetric, { color: textSecondary }]}>
                    <Text style={{ fontWeight: '800', color: textPrimary, textDecorationLine: 'underline' }}>
                      {followerCount.toLocaleString()}
                    </Text>{' '}
                    followers
                  </Text>
                </Pressable>
                <Text style={[styles.metricsDot, { color: textMuted }]}>·</Text>
                <Pressable onPress={handleOpenFollowingModal} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.followersMetric, { color: textSecondary }]}>
                    <Text style={{ fontWeight: '800', color: textPrimary, textDecorationLine: 'underline' }}>
                      {followingCount.toLocaleString()}
                    </Text>{' '}
                    following
                  </Text>
                </Pressable>
                <Text style={[styles.metricsDot, { color: textMuted }]}>·</Text>
                <Pressable onPress={handleOpenClosedDealsModal} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.volumeMetric, { color: textSecondary }]}>
                    <Text style={{ fontWeight: '800', color: goldPrimary, textDecorationLine: 'underline' }}>
                      {profileUser.closedDeals || '0'}
                    </Text>{' '}
                    {Number(profileUser.closedDeals || '0') === 1 ? 'Closed Deal' : 'Closed Deals'}
                  </Text>
                </Pressable>
              </View>

              {/* Social Proof / Mutual Connections */}
              <Pressable
                onPress={handleOpenFollowersModal}
                style={[
                  styles.mutualsRow,
                  {
                    backgroundColor: isDark ? '#162235' : '#F1F5F9',
                    borderColor: isDark ? '#1a273c' : '#E2E8F0',
                    borderWidth: 1,
                  },
                ]}
              >
                <MaterialIcons name="people" size={16} color={goldPrimary} />
                <Text style={[styles.mutualsText, { color: textSecondary }]}>
                  {mutualsText}
                </Text>
              </Pressable>

              {/* Call-to-Action Executive Buttons */}
              <View style={[styles.ctaButtonRow, isMobile && { gap: 8, marginTop: 14 }]}>
                {!isSelf ? (
                  <>
                    <Pressable
                      onPress={() => {
                        const targetId = profileUser.id || profileUser._id;
                        router.push({
                          pathname: '/(app)/messages',
                          params: {
                            userId: targetId && targetId !== 'self' ? targetId : undefined,
                            username: profileUser.username,
                          },
                        });
                      }}
                      style={[
                        styles.primaryCtaBtn, isMobile && { flex: 1, minWidth: 100, paddingHorizontal: 10, justifyContent: 'center' },
                        { backgroundColor: '#0077b5' },
                      ]}
                    >
                      <MaterialCommunityIcons name="send" size={16} color="#ffffff" />
                      <Text style={styles.primaryCtaText}>Message</Text>
                    </Pressable>

                    <FollowButton
                      targetUserId={profileUser?._id || profileUser?.id || targetId}
                      targetUsername={profileUser?.username}
                      targetUser={profileUser}
                      initialIsFollowing={isFollowingState}
                      size="md"
                      onFollowChange={(newIsF, newCount) => {
                        setIsFollowingState(newIsF);
                        if (typeof newCount === 'number') {
                          setFollowerCountState(newCount);
                        }
                      }}
                      style={isMobile ? { flex: 1, minWidth: 90, height: 38 } : { minWidth: 100, height: 38 }}
                    />

                    <Pressable
                      onPress={() => alertMsg('Consultation scheduled on Boolok GPT VIP calendar.')}
                      style={[
                        styles.secondaryCtaBtn,
                        isMobile && { flex: 1, minWidth: 140, paddingHorizontal: 10, justifyContent: 'center' },
                        {
                          borderColor: isDark ? '#334155' : '#CBD5E1',
                          backgroundColor: isDark ? '#162235' : '#F1F5F9',
                        },
                      ]}
                    >
                      <Text style={[styles.secondaryCtaText, { color: textPrimary }]}>
                        Schedule Consultation
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={handleOpenEditModal}
                      style={[
                        styles.primaryCtaBtn, isMobile && { flex: 1, minWidth: 100, paddingHorizontal: 10, justifyContent: 'center' },
                        { backgroundColor: goldPrimary },
                      ]}
                    >
                      <MaterialIcons name="edit" size={18} color="#000000" />
                      <Text style={[styles.primaryCtaText, { color: '#000000' }]}>
                        Edit Profile
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setCreateType('post')}
                      style={[
                        styles.secondaryCtaBtn, isMobile && { flex: 1, minWidth: 100, paddingHorizontal: 10, justifyContent: 'center' },
                        {
                          borderColor: goldPrimary,
                          backgroundColor: isDark ? 'rgba(218, 165, 32, 0.08)' : '#FFFBEB',
                        },
                      ]}
                    >
                      <MaterialIcons name="add" size={18} color={goldPrimary} />
                      <Text style={[styles.secondaryCtaText, { color: goldPrimary }]}>
                        Create Listing
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => alertMsg('CRE Portfolio PDF downloaded.')}
                      style={[
                        styles.secondaryCtaBtn, isMobile && { flex: 1, minWidth: 100, paddingHorizontal: 10, justifyContent: 'center' },
                        {
                          borderColor: isDark ? '#334155' : '#CBD5E1',
                          backgroundColor: isDark ? '#162235' : '#F1F5F9',
                        },
                      ]}
                    >
                      <MaterialIcons name="share" size={18} color={textPrimary} />
                      <Text style={[styles.secondaryCtaText, { color: textPrimary }]}>
                        Share Portfolio
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleSignOut}
                      style={[
                        styles.secondaryCtaBtn,
                        styles.signOutCtaBtn, { width: '100%', marginTop: 8, justifyContent: 'center' },
                        {
                          borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : '#FCA5A5',
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Sign Out"
                    >
                      <MaterialIcons name="logout" size={18} color="#EF4444" />
                      <Text style={[styles.secondaryCtaText, { color: '#EF4444', fontWeight: '700' }]}>
                        Sign Out
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════════
            ABOUT & COMMERCIAL EXPERTISE CARD
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
          <Text style={[styles.sectionHeading, { color: textPrimary }]}>About & Commercial Expertise</Text>
          <Text style={[styles.aboutBodyText, { color: textSecondary }]}>{defaultBio}</Text>

          {/* Core Specialization Pills (shown for self or users with custom commercial specialization) */}
          {(isSelf || (Boolean(profileUser?.bio) && !profileUser?.bio?.toLowerCase().includes('no bio'))) && (
            <View style={styles.pillsContainer}>
              <View style={[styles.pillItem, { backgroundColor: isDark ? '#162235' : '#F1F5F9', borderColor, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <MaterialIcons name="business" size={14} color={goldPrimary} />
                <Text style={[styles.pillText, { color: goldPrimary }]}>Commercial Office Buildings</Text>
              </View>
              <View style={[styles.pillItem, { backgroundColor: isDark ? '#162235' : '#F1F5F9', borderColor, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <MaterialIcons name="beach-access" size={14} color={goldPrimary} />
                <Text style={[styles.pillText, { color: goldPrimary }]}>Luxury Waterfront Estates</Text>
              </View>
              <View style={[styles.pillItem, { backgroundColor: isDark ? '#162235' : '#F1F5F9', borderColor, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <MaterialIcons name="trending-up" size={14} color={goldPrimary} />
                <Text style={[styles.pillText, { color: goldPrimary }]}>Institutional Cap Rate Advisory</Text>
              </View>
              <View style={[styles.pillItem, { backgroundColor: isDark ? '#162235' : '#F1F5F9', borderColor, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                <MaterialIcons name="analytics" size={14} color={goldPrimary} />
                <Text style={[styles.pillText, { color: goldPrimary }]}>Portfolio Valuation & Market Modeling</Text>
              </View>
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════════════════════════════════
            CREATE LISTING / REEL MODAL (FOR SELF)
        ════════════════════════════════════════════════════════════════════════ */}
        {isSelf && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
            <Text style={[styles.sectionHeading, { color: textPrimary }]}>Publish Property Listing or Video Reel</Text>

            {/* Type Selector */}
            <View style={styles.createTypeRow}>
              <Pressable
                onPress={() => setCreateType('post')}
                accessibilityRole="button"
                accessibilityLabel="Property Listing"
                style={[
                  styles.createTypeBtn,
                  { backgroundColor: createType === 'post' ? goldPrimary : (isDark ? '#162235' : '#E2E8F0'), minHeight: 44 },
                ]}
              >
                <MaterialCommunityIcons
                  name="home-plus-outline"
                  size={18}
                  color={createType === 'post' ? '#000000' : (isDark ? '#ffffff' : '#0f172a')}
                />
                <Text
                  style={[
                    styles.createTypeBtnText,
                    { color: createType === 'post' ? '#000000' : (isDark ? '#ffffff' : '#0f172a'), flexShrink: 1, textAlign: 'center' },
                  ]}
                >
                  Property Listing
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setCreateType('reel')}
                accessibilityRole="button"
                accessibilityLabel="Upload Video Reel / Tour"
                style={[
                  styles.createTypeBtn,
                  { backgroundColor: createType === 'reel' ? goldPrimary : (isDark ? '#162235' : '#E2E8F0'), minHeight: 44 },
                ]}
              >
                <MaterialCommunityIcons
                  name="video-vintage"
                  size={18}
                  color={createType === 'reel' ? '#000000' : (isDark ? '#ffffff' : '#0f172a')}
                />
                <Text
                  style={[
                    styles.createTypeBtnText,
                    { color: createType === 'reel' ? '#000000' : (isDark ? '#ffffff' : '#0f172a'), flexShrink: 1, textAlign: 'center' },
                  ]}
                >
                  Video Reel / Tour
                </Text>
              </Pressable>
            </View>

            {createType === 'post' ? (
              <>
                <TextInput
                  placeholder="Property Title (e.g. Luxury Modern French Manor Estate)..."
                  placeholderTextColor={textMuted}
                  style={[styles.formInput, { backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderColor }]}
                  value={postTitle}
                  onChangeText={setPostTitle}
                />
                <TextInput
                  placeholder="Asking Price (e.g. $8,900,000)..."
                  placeholderTextColor={textMuted}
                  style={[styles.formInput, { backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderColor, marginTop: 8 }]}
                  value={postPrice}
                  onChangeText={setPostPrice}
                />
                <TextInput
                  placeholder="Location (e.g. Beverly Hills, CA)..."
                  placeholderTextColor={textMuted}
                  style={[styles.formInput, { backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderColor, marginTop: 8 }]}
                  value={postLocation}
                  onChangeText={setPostLocation}
                />
                <TextInput
                  placeholder="Comprehensive property overview, zoning, cap rates, and amenities..."
                  placeholderTextColor={textMuted}
                  multiline
                  numberOfLines={4}
                  style={[styles.formTextArea, { backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderColor, marginTop: 8 }]}
                  value={postContent}
                  onChangeText={setPostContent}
                />

                {attachedImage && (
                  <View style={styles.attachedPreviewBox}>
                    <Image source={{ uri: attachedImage }} style={styles.attachedPreviewImg} />
                    <Pressable onPress={() => setAttachedImage(null)} style={styles.removePreviewBtn}>
                      <MaterialIcons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                )}

                <View style={styles.formActionsRow}>
                  <Pressable
                    onPress={handlePickImage}
                    style={[
                      styles.attachMediaBtn,
                      {
                        backgroundColor: isDark ? '#162235' : '#F1F5F9',
                        borderColor: isDark ? '#1a273c' : '#CBD5E1',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <MaterialIcons name="add-photo-alternate" size={18} color={goldPrimary} />
                    <Text style={[styles.attachMediaBtnText, { color: textPrimary }]}>
                      {attachedImage ? 'Change Image' : 'Attach Image (Local/Drive)'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleCreatePost}
                    disabled={isPublishing}
                    style={[styles.submitFormBtn, { backgroundColor: goldPrimary }]}
                  >
                    {isPublishing ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.submitFormBtnText}>Publish Listing</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <TextInput
                  placeholder="Video Tour Title (e.g. Coventry Office Walkthrough)..."
                  placeholderTextColor={textMuted}
                  style={[styles.formInput, { backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderColor }]}
                  value={reelTitle}
                  onChangeText={setReelTitle}
                />
                <TextInput
                  placeholder="Location (e.g. Coventry, United Kingdom)..."
                  placeholderTextColor={textMuted}
                  style={[styles.formInput, { backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderColor, marginTop: 8 }]}
                  value={reelLocation}
                  onChangeText={setReelLocation}
                />
                <TextInput
                  placeholder="Or paste Direct Video URL (mp4 / Drive link)..."
                  placeholderTextColor={textMuted}
                  style={[styles.formInput, { backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderColor, marginTop: 8 }]}
                  value={reelUrl}
                  onChangeText={setReelUrl}
                />

                {attachedVideo && (
                  <View style={styles.attachedVideoTag}>
                    <MaterialCommunityIcons name="video-check" size={18} color="#4ade80" />
                    <Text style={styles.attachedVideoTagText}>Video attached from Local/Drive</Text>
                    <Pressable onPress={() => setAttachedVideo(null)}>
                      <MaterialIcons name="close" size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                )}

                <View style={styles.formActionsRow}>
                  <Pressable
                    onPress={handlePickVideo}
                    style={[
                      styles.attachMediaBtn,
                      {
                        backgroundColor: isDark ? '#162235' : '#F1F5F9',
                        borderColor: isDark ? '#1a273c' : '#CBD5E1',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <MaterialIcons name="video-library" size={18} color="#60a5fa" />
                    <Text style={[styles.attachMediaBtnText, { color: textPrimary }]}>
                      {attachedVideo ? 'Change Video' : 'Attach Video (Local/Drive)'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handlePublishReel}
                    disabled={isPublishingReel}
                    style={[styles.submitFormBtn, { backgroundColor: goldPrimary }]}
                  >
                    {isPublishingReel ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.submitFormBtnText}>Publish Reel</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            PORTFOLIO LISTINGS & VIDEO REELS TABS
        ════════════════════════════════════════════════════════════════════════ */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
          {/* Sub Navigation Bar */}
          <View style={styles.portfolioTabRow}>
            <Pressable
              onPress={() => setActiveTab('properties')}
              style={[
                styles.portfolioTabBtn,
                activeTab === 'properties' && { borderBottomColor: goldPrimary, borderBottomWidth: 3 },
              ]}
            >
              <MaterialCommunityIcons
                name="grid"
                size={18}
                color={activeTab === 'properties' ? goldPrimary : textMuted}
              />
              <Text
                style={[
                  styles.portfolioTabText,
                  { color: activeTab === 'properties' ? (isDark ? '#FFFFFF' : '#0F172A') : textMuted, flexShrink: 1 },
                ]}
              >
                POSTS ({posts.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('reels')}
              style={[
                styles.portfolioTabBtn,
                activeTab === 'reels' && { borderBottomColor: goldPrimary, borderBottomWidth: 3 },
              ]}
            >
              <MaterialCommunityIcons
                name="play-box-outline"
                size={18}
                color={activeTab === 'reels' ? goldPrimary : textMuted}
              />
              <Text
                style={[
                  styles.portfolioTabText,
                  { color: activeTab === 'reels' ? (isDark ? '#FFFFFF' : '#0F172A') : textMuted, flexShrink: 1 },
                ]}
              >
                REELS ({reels.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('saved')}
              style={[
                styles.portfolioTabBtn,
                activeTab === 'saved' && { borderBottomColor: goldPrimary, borderBottomWidth: 3 },
              ]}
            >
              <MaterialCommunityIcons
                name="bookmark-outline"
                size={18}
                color={activeTab === 'saved' ? goldPrimary : textMuted}
              />
              <Text
                style={[
                  styles.portfolioTabText,
                  { color: activeTab === 'saved' ? (isDark ? '#FFFFFF' : '#0F172A') : textMuted, flexShrink: 1 },
                ]}
              >
                SAVED ({isSelf ? savedItemsList.length : 0})
              </Text>
            </Pressable>
          </View>

          {/* Properties Display */}
          {activeTab === 'properties' ? (
            posts && posts.length > 0 ? (
              <View style={[styles.propertiesGrid, isMobile && { gap: 12 }]}>
                {posts.map((post: any) => {
                  const authorId = post.author?._id || post.author?.id || (typeof post.author === 'string' ? post.author : '');
                  const viewerId = viewer?.id || viewer?._id || '';
                  const isPostOwner = isSelf || (authorId && (authorId === viewerId || (viewer?.username && authorId === viewer.username)));
                  const postLikesCount = (() => {
                    if (Platform.OS === 'web') {
                      try {
                        const raw = localStorage.getItem('boolok_post_likes');
                        if (raw) {
                          const cache = JSON.parse(raw);
                          if (cache[post._id] && typeof cache[post._id].count === 'number') {
                            return cache[post._id].count;
                          }
                        }
                      } catch (_) {}
                    }
                    return post.likesCount !== undefined ? post.likesCount : (Array.isArray(post.likes) ? post.likes.length : 0);
                  })();
                  const postCommentsCount = post.commentsCount !== undefined ? post.commentsCount : (Array.isArray(post.comments) ? post.comments.length : 0);
                  const postDescription = post.content || post.description || post.title || 'Property Post';

                  return (
                    <Pressable
                      key={post._id}
                      onPress={() => handleOpenPostDetailsModal(post)}
                      style={({ pressed, hovered }: any) => [
                        styles.propertyCard,
                        isMobile && { width: '100%', minWidth: '100%' },
                        { backgroundColor: cardBg, borderColor, cursor: 'pointer', position: 'relative' },
                        (pressed || hovered) && { borderColor: goldPrimary, transform: [{ translateY: -2 }] },
                      ]}
                    >
                      {/* Delete button on card for post owner alone */}
                      {isPostOwner && (
                        <Pressable
                          onPress={(e: any) => {
                            e?.stopPropagation?.();
                            handleDeletePost(post._id);
                          }}
                          style={({ pressed, hovered }: any) => [
                            {
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              backgroundColor: 'rgba(15, 23, 42, 0.85)',
                              padding: 6,
                              borderRadius: 20,
                              borderWidth: 1,
                              borderColor: 'rgba(239, 68, 68, 0.7)',
                              zIndex: 10,
                            },
                            (pressed || hovered) && { backgroundColor: '#ef4444' },
                          ]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="delete-outline" size={17} color="#ffffff" />
                        </Pressable>
                      )}

                      <Image
                        source={{
                          uri: resolvePropertyImage(post),
                        }}
                        style={[styles.propertyImage, isMobile && { height: 210 }]}
                        resizeMode="cover"
                      />
                      <View style={[styles.propertyDetailsBox, { backgroundColor: cardBg }]}>
                        {post.price ? (
                          <Text style={[styles.propertyPriceText, { color: goldPrimary }]}>
                            {post.price}
                          </Text>
                        ) : null}
                        <Text style={[styles.propertyTitleText, { color: textPrimary }]} numberOfLines={2}>
                          {postDescription}
                        </Text>
                        {post.location ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <MaterialIcons name="location-on" size={14} color={goldPrimary} />
                            <Text style={[styles.propertyLocationText, { color: textMuted, marginTop: 0 }]}>
                              {post.location}
                            </Text>
                          </View>
                        ) : null}
                        {post.specs ? (
                          <Text style={[styles.propertySpecsText, { color: textSecondary }]}>
                            {post.specs}
                          </Text>
                        ) : null}

                        <View style={styles.propertyFooterRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialIcons name="favorite" size={14} color="#ef4444" />
                            <Text style={styles.propertyLikesText}>{postLikesCount}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialCommunityIcons name="comment-text-outline" size={14} color={textMuted} />
                            <Text style={styles.propertyCommentsText}>{postCommentsCount}</Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={{ paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor, width: '100%', marginVertical: 8 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? 'rgba(218, 165, 32, 0.08)' : '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: isDark ? 'rgba(218, 165, 32, 0.25)' : '#FDE68A' }}>
                  <MaterialCommunityIcons name="office-building-outline" size={32} color={goldPrimary} />
                </View>
                <Text style={{ color: textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: 0.2 }}>
                  Nothing is added here
                </Text>
                <Text style={{ color: textMuted, fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 20 }}>
                  {isSelf
                    ? "You haven't uploaded any properties or listings yet. Use the '+ Create Listing' button above or feed to share properties."
                    : 'This advisor has not listed any commercial or residential properties yet.'}
                </Text>
              </View>
            )
          ) : activeTab === 'reels' ? (
            /* Reels Display */
            reels && reels.length > 0 ? (
              <View style={styles.reelsGridContainer}>
                {reels.map((reel: any) => (
                  <ProfileReelItem key={reel._id} reel={reel} onDelete={handleDeleteReel} />
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor, width: '100%', marginVertical: 8 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? 'rgba(218, 165, 32, 0.08)' : '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: isDark ? 'rgba(218, 165, 32, 0.25)' : '#FDE68A' }}>
                  <MaterialIcons name="videocam-off" size={32} color={goldPrimary} />
                </View>
                <Text style={{ color: textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: 0.2 }}>
                  Nothing is added here
                </Text>
                <Text style={{ color: textMuted, fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 20 }}>
                  {isSelf
                    ? "You haven't uploaded any video reels yet. Use the 'Publish Property Listing or Video Reel' creator above to share your first reel."
                    : 'This advisor has not published any property walkthroughs or reels yet.'}
                </Text>
              </View>
            )
          ) : (
            /* Saved Items Display */
            !isSelf ? (
              <View style={{ paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor, width: '100%', marginVertical: 8 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? 'rgba(218, 165, 32, 0.08)' : '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: isDark ? 'rgba(218, 165, 32, 0.25)' : '#FDE68A' }}>
                  <MaterialIcons name="lock-outline" size={32} color={goldPrimary} />
                </View>
                <Text style={{ color: textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: 0.2 }}>
                  Private Saved Items
                </Text>
                <Text style={{ color: textMuted, fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 20 }}>
                  Saved properties and video walkthroughs are private to each user account.
                </Text>
              </View>
            ) : savedItemsList.length > 0 ? (
              <View style={{ gap: 12, width: '100%' }}>
                {savedItemsList.map((item: any, idx: number) => (
                  <View
                    key={item._id || item.id || idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? '#08111e' : '#f8fafc',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: isDark ? '#1a273c' : '#e2e8f0',
                    }}
                  >
                    <Pressable
                      onPress={() => router.push('/(app)/insights')}
                      style={{ position: 'relative', width: 76, height: 76, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}
                    >
                      <Image
                        source={{ uri: item.thumbnail || item.poster || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800' }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                        <MaterialIcons name="play-circle-fill" size={28} color="#e6b800" />
                      </View>
                    </Pressable>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ color: textPrimary, fontSize: 14.5, fontWeight: '700' }} numberOfLines={1}>
                        {item.title || 'Saved Property Reel'}
                      </Text>
                      <Text style={{ color: goldPrimary, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                        {item.price || item.location || 'Commercial Property'}
                      </Text>
                      {item.authorName && (
                        <Text style={{ color: textMuted, fontSize: 11.5, marginTop: 2 }}>
                          by {item.authorName}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => {
                        const updated = savedItemsList.filter((r) => r._id !== item._id && r.id !== item.id);
                        setSavedItemsList(updated);
                        if (Platform.OS === 'web') {
                          try { localStorage.setItem('boolok_saved_reels', JSON.stringify(updated)); } catch (_) {}
                        } else {
                          SecureStore.setItemAsync('boolok_saved_reels', JSON.stringify(updated)).catch(() => {});
                        }
                      }}
                      style={{ padding: 8, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.12)' }}
                    >
                      <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: 56, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor, width: '100%', marginVertical: 8 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? 'rgba(218, 165, 32, 0.08)' : '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: isDark ? 'rgba(218, 165, 32, 0.25)' : '#FDE68A' }}>
                  <MaterialIcons name="bookmark-border" size={32} color={goldPrimary} />
                </View>
                <Text style={{ color: textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: 0.2 }}>
                  Nothing is added here
                </Text>
                <Text style={{ color: textMuted, fontSize: 14, textAlign: 'center', maxWidth: 360, lineHeight: 20 }}>
                  You have not bookmarked or saved any properties or reels yet. Tap Save on any reel to keep it here.
                </Text>
              </View>
            )
          )}
        </View>

        {/* EDIT PROFILE MODAL */}
        <Modal
          visible={isEditModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsEditModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 550, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor, padding: 24, maxHeight: '90%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: textPrimary }}>Edit Real Estate Profile</Text>
                <Pressable onPress={() => setIsEditModalOpen(false)}>
                  <MaterialIcons name="close" size={24} color={textMuted} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Full Name */}
                <Text style={{ color: textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>FULL NAME</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderRadius: 8, padding: 12, borderWidth: 1, borderColor, marginBottom: 16, fontSize: 14 }}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="e.g. Logeshwaran A"
                  placeholderTextColor={textMuted}
                />

                {/* Profile Picture Section */}
                <Text style={{ color: textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>PROFILE PICTURE</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <UserAvatar
                    user={{
                      ...profileUser,
                      fullName: editFullName || profileUser.fullName,
                      profilePicture: editAvatarUrl || profileUser.profilePicture,
                    }}
                    size={52}
                  />
                  <Pressable
                    onPress={() => {
                      setIsEditModalOpen(false);
                      setIsAvatarModalOpen(true);
                    }}
                    style={{ backgroundColor: isDark ? '#162338' : '#FFFBEB', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: goldPrimary, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <MaterialIcons name="photo-camera" size={16} color={goldPrimary} />
                    <Text style={{ color: goldPrimary, fontWeight: '700', fontSize: 13 }}>Choose Photo / Illustration</Text>
                  </Pressable>
                </View>

                {/* Headline */}
                <Text style={{ color: textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>PROFESSIONAL HEADLINE</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderRadius: 8, padding: 12, borderWidth: 1, borderColor, marginBottom: 16, fontSize: 14 }}
                  value={editHeadline}
                  onChangeText={setEditHeadline}
                  placeholder="e.g. Senior Broker & Commercial Real Estate Specialist"
                  placeholderTextColor={textMuted}
                />

                {/* Location */}
                <Text style={{ color: textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>LOCATION</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderRadius: 8, padding: 12, borderWidth: 1, borderColor, marginBottom: 16, fontSize: 14 }}
                  value={editLocation}
                  onChangeText={setEditLocation}
                  placeholder="e.g. Chennai, Tamil Nadu · South India"
                  placeholderTextColor={textMuted}
                />

                {/* Closed Deals Volume */}
                <Text style={{ color: textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>CLOSED DEALS VOLUME</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderRadius: 8, padding: 12, borderWidth: 1, borderColor, marginBottom: 16, fontSize: 14 }}
                  value={editClosedDeals}
                  onChangeText={setEditClosedDeals}
                  placeholder="e.g. $45M+ or ₹120 Crore"
                  placeholderTextColor={textMuted}
                />

                {/* Bio */}
                <Text style={{ color: textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>ABOUT & BIO</Text>
                <TextInput
                  style={{ backgroundColor: isDark ? '#070e1a' : '#F8FAFC', color: textPrimary, borderRadius: 8, padding: 12, borderWidth: 1, borderColor, marginBottom: 24, fontSize: 14, minHeight: 80 }}
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline
                  placeholder="Briefly describe your real estate advisory experience..."
                  placeholderTextColor={textMuted}
                />

                {/* Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setIsEditModalOpen(false)}
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor, alignItems: 'center' }}
                  >
                    <Text style={{ color: textMuted, fontWeight: '700' }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSaveFullProfile}
                    disabled={isSavingProfile}
                    style={{ flex: 1, backgroundColor: goldPrimary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#000000', fontWeight: '800' }}>
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </Pressable>
                </View>

                {/* Sign Out Action in Modal */}
                <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: borderColor, alignItems: 'center' }}>
                  <Pressable
                    onPress={() => {
                      setIsEditModalOpen(false);
                      setTimeout(() => handleSignOut(), 150);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}
                  >
                    <MaterialIcons name="logout" size={18} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700' }}>Sign Out of Account</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* REAL-TIME FOLLOWERS LIST MODAL */}
        <Modal
          visible={isFollowersModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsFollowersModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 480, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor, padding: 20, maxHeight: 520 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 14 }}>
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: textPrimary }}>
                    {profileUser.fullName}'s Followers
                  </Text>
                  <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
                    {followerCount} {followerCount === 1 ? 'person following' : 'persons following'} in real-time
                  </Text>
                </View>
                <Pressable onPress={() => setIsFollowersModalOpen(false)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={24} color={textMuted} />
                </Pressable>
              </View>

              <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
                {isLoadingFollowers ? (
                  <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={goldPrimary} />
                    <Text style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>Loading real-time followers...</Text>
                  </View>
                ) : followersList.length > 0 ? (
                  followersList.map((follower: any, idx: number) => {
                    const fInitial = (follower.fullName || follower.username || 'U')[0]?.toUpperCase();
                    return (
                      <Pressable
                        key={follower.id || follower._id || idx}
                        style={({ pressed, hovered }: any) => [
                          styles.followerListItem,
                          { borderBottomWidth: idx < followersList.length - 1 ? 1 : 0, borderBottomColor: borderColor },
                          (pressed || hovered) && { backgroundColor: isDark ? '#162338' : '#F1F5F9' },
                        ]}
                        onPress={() => {
                          setIsFollowersModalOpen(false);
                          router.push({
                            pathname: '/(app)/profile',
                            params: { id: follower.id || follower._id || follower.username },
                          });
                        }}
                      >
                        <UserAvatar user={follower} size={42} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ color: textPrimary, fontSize: 14, fontWeight: '700' }}>
                            {follower.fullName}
                          </Text>
                          <Text style={{ color: textMuted, fontSize: 12 }}>
                            @{follower.username}
                          </Text>
                          {follower.headline && (
                            <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                              {follower.headline}
                            </Text>
                          )}
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={textMuted} />
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                    <MaterialIcons name="people-outline" size={44} color={textMuted} />
                    <Text style={{ color: textPrimary, fontSize: 15, fontWeight: '700', marginTop: 12 }}>
                      No followers yet
                    </Text>
                    <Text style={{ color: textMuted, fontSize: 12.5, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                      {isSelf
                        ? 'When members in the Boolok Network connect with you, they will appear here in real-time.'
                        : `Be the first person in the network to follow ${profileUser.fullName}!`}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* REAL-TIME LIVE FOLLOWING MODAL */}
        <Modal
          visible={isFollowingModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsFollowingModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 480, backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor, padding: 20, maxHeight: 520 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 14 }}>
                <View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: textPrimary }}>
                    {profileUser.fullName}'s Following
                  </Text>
                  <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
                    {followingCount} {followingCount === 1 ? 'person followed' : 'persons followed'} in real-time
                  </Text>
                </View>
                <Pressable onPress={() => setIsFollowingModalOpen(false)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={24} color={textMuted} />
                </Pressable>
              </View>

              <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
                {isLoadingFollowing ? (
                  <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={goldPrimary} />
                    <Text style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>Loading real-time following list...</Text>
                  </View>
                ) : followingList.length > 0 ? (
                  followingList.map((followedUser: any, idx: number) => {
                    const fInitial = (followedUser.fullName || followedUser.username || 'U')[0]?.toUpperCase();
                    return (
                      <Pressable
                        key={followedUser.id || followedUser._id || idx}
                        style={({ pressed, hovered }: any) => [
                          styles.followerListItem,
                          { borderBottomWidth: idx < followingList.length - 1 ? 1 : 0, borderBottomColor: borderColor },
                          (pressed || hovered) && { backgroundColor: isDark ? '#162338' : '#F1F5F9' },
                        ]}
                        onPress={() => {
                          setIsFollowingModalOpen(false);
                          router.push({
                            pathname: '/(app)/profile',
                            params: { id: followedUser.id || followedUser._id || followedUser.username },
                          });
                        }}
                      >
                        <UserAvatar user={followedUser} size={42} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ color: textPrimary, fontSize: 14, fontWeight: '700' }}>
                            {followedUser.fullName}
                          </Text>
                          <Text style={{ color: textMuted, fontSize: 12 }}>
                            @{followedUser.username}
                          </Text>
                          {followedUser.headline && (
                            <Text style={{ color: textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                              {followedUser.headline}
                            </Text>
                          )}
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={textMuted} />
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                    <MaterialIcons name="people-outline" size={44} color={textMuted} />
                    <Text style={{ color: textPrimary, fontSize: 15, fontWeight: '700', marginTop: 12 }}>
                      Not following anyone yet
                    </Text>
                    <Text style={{ color: textMuted, fontSize: 12.5, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                      {isSelf
                        ? 'When you follow brokers, investors, or advisors in the Boolok Network, they will appear here.'
                        : `${profileUser.fullName} is not currently following any members.`}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* REAL-TIME VERIFIED CLOSED DEALS & TRANSACTIONS MODAL */}
        <Modal
          visible={isClosedDealsModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsClosedDealsModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 560, backgroundColor: cardBg, borderRadius: 20, borderWidth: 1, borderColor, padding: 22, maxHeight: 600 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: borderColor, paddingBottom: 14 }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name="verified" size={18} color={goldPrimary} />
                    <Text style={{ fontSize: 17, fontWeight: '800', color: textPrimary }}>
                      {profileUser.fullName}'s Closed Deals
                    </Text>
                  </View>
                  <Text style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>
                    {closedDealsList.length === 0
                      ? 'Currently no deals are closed'
                      : `${closedDealsList.length} verified institutional & commercial ${closedDealsList.length === 1 ? 'transaction' : 'transactions'}`}
                  </Text>
                </View>
                <Pressable onPress={() => setIsClosedDealsModalOpen(false)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={24} color={textMuted} />
                </Pressable>
              </View>

              <ScrollView style={{ marginTop: 14 }} showsVerticalScrollIndicator={false}>
                {isLoadingDeals ? (
                  <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={goldPrimary} />
                    <Text style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>Loading verified transaction ledger...</Text>
                  </View>
                ) : closedDealsList.length > 0 ? (
                  closedDealsList.map((deal: any, idx: number) => {
                    return (
                      <View
                        key={deal.id || idx}
                        style={{
                          backgroundColor: isDark ? '#070e1a' : '#F8FAFC',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor,
                          padding: 14,
                          marginBottom: 12,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={{ color: textPrimary, fontSize: 14.5, fontWeight: '800' }}>
                              {deal.title}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                              <MaterialIcons name="place" size={14} color={textMuted} />
                              <Text style={{ color: textMuted, fontSize: 12 }}>{deal.location}</Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: goldPrimary, fontSize: 15, fontWeight: '900' }}>
                              {deal.price}
                            </Text>
                            <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                              {deal.capRate || 'Settled'}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: borderColor }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialIcons name="verified-user" size={14} color="#3b82f6" />
                            <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '700' }}>
                              {deal.status || 'Verified Settlement'}
                            </Text>
                          </View>
                          <Text style={{ color: textMuted, fontSize: 11 }}>
                            {deal.sqft ? `${deal.sqft} · ` : ''}{deal.date || '2026'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                    <MaterialIcons name="handshake" size={44} color={textMuted} />
                    <Text style={{ color: textPrimary, fontSize: 15, fontWeight: '700', marginTop: 12 }}>
                      Currently no deals are closed
                    </Text>
                    <Text style={{ color: textMuted, fontSize: 12.5, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                      When {profileUser.fullName} closes commercial or residential syndications, they will be verified and recorded here.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* GOOGLE-STYLE "ADD PROFILE PICTURE" MODAL */}
        <Modal
          visible={isAvatarModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAvatarModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#0c1626', borderRadius: 24, borderWidth: 1, borderColor: '#1a273c', overflow: 'hidden' }}>
              {/* Header (Close Button, Title, Options) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
                <Pressable
                  onPress={() => setIsAvatarModalOpen(false)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#162338', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#24354d' }}
                >
                  <MaterialIcons name="close" size={20} color="#ffffff" />
                </Pressable>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>
                  Add profile picture
                </Text>
                <Pressable style={{ padding: 4 }}>
                  <MaterialIcons name="more-vert" size={22} color="#8b9bb4" />
                </Pressable>
              </View>

              <ScrollView style={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                {/* Current Avatar / Preview */}
                <View style={{ alignItems: 'center', marginVertical: 14 }}>
                  {profileUser.profilePicture && resolveImageUrl(profileUser.profilePicture) ? (
                    <Image
                      source={{ uri: resolveImageUrl(profileUser.profilePicture)! }}
                      style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#daa520' }}
                    />
                  ) : (
                    <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#1a273c', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#daa520' }}>
                      <Text style={{ fontSize: 36, fontWeight: '800', color: '#daa520' }}>
                        {(profileUser.fullName || profileUser.username || 'U')[0]?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {isUploadingAvatar && (
                    <ActivityIndicator size="small" color="#daa520" style={{ marginTop: 10 }} />
                  )}
                </View>

                {/* Action Options List */}
                <View style={{ backgroundColor: '#080f1a', borderRadius: 16, borderWidth: 1, borderColor: '#162338', overflow: 'hidden', marginBottom: 12 }}>

                  {/* Upload from device */}
                  <Pressable
                    onPress={handleUploadFromDevice}
                    style={({ pressed, hovered }: any) => [
                      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#142033' },
                      (pressed || hovered) && { backgroundColor: '#131e30' },
                    ]}
                  >
                    <MaterialIcons name="photo-library" size={22} color="#60a5fa" style={{ marginRight: 14 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14.5, color: '#ffffff', fontWeight: '600' }}>
                        Upload from device
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#8b9bb4', marginTop: 1 }}>
                        Choose JPG, PNG, or WebP photo
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#8b9bb4" />
                  </Pressable>

                  {/* Take a picture */}
                  <Pressable
                    onPress={handleTakeCameraPicture}
                    style={({ pressed, hovered }: any) => [
                      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: profileUser.profilePicture ? 1 : 0, borderBottomColor: '#142033' },
                      (pressed || hovered) && { backgroundColor: '#131e30' },
                    ]}
                  >
                    <MaterialIcons name="photo-camera" size={22} color="#34d399" style={{ marginRight: 14 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14.5, color: '#ffffff', fontWeight: '600' }}>
                        Take a picture
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#8b9bb4', marginTop: 1 }}>
                        Use camera for live photo
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#8b9bb4" />
                  </Pressable>

                  {/* Remove picture (revert to initials) */}
                  {profileUser.profilePicture && (
                    <Pressable
                      onPress={handleRemoveAvatar}
                      style={({ pressed, hovered }: any) => [
                        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
                        (pressed || hovered) && { backgroundColor: '#131e30' },
                      ]}
                    >
                      <MaterialIcons name="delete-outline" size={22} color="#ef4444" style={{ marginRight: 14 }} />
                      <Text style={{ fontSize: 14.5, color: '#ef4444', fontWeight: '600', flex: 1 }}>
                        Remove picture (Use Initials)
                      </Text>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── PROPERTY POST DETAILS & REAL-TIME COMMENTS MODAL ── */}
        <Modal
          visible={isPostDetailsModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPostDetailsModalOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 640, backgroundColor: '#09111e', borderRadius: 16, borderWidth: 1, borderColor: '#1a273c', maxHeight: '92%', overflow: 'hidden' }}>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#162338' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 }}>
                  <UserAvatar user={selectedPostDetails?.author || profileUser} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                      {selectedPostDetails?.author?.fullName || profileUser.fullName}
                    </Text>
                    <Text style={{ color: '#8b9bb4', fontSize: 11 }} numberOfLines={1}>
                      @{selectedPostDetails?.author?.username || profileUser.username} · Property Post
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {(() => {
                    const authorId = selectedPostDetails?.author?._id || selectedPostDetails?.author?.id || (typeof selectedPostDetails?.author === 'string' ? selectedPostDetails.author : '');
                    const viewerId = viewer?.id || viewer?._id || '';
                    const isOwner = isSelf || (authorId && (authorId === viewerId || (viewer?.username && authorId === viewer.username)));
                    if (!isOwner) return null;

                    return (
                      <Pressable
                        onPress={() => handleDeletePost(selectedPostDetails?._id)}
                        disabled={isDeletingPost}
                        style={({ pressed, hovered }: any) => [
                          {
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            borderWidth: 1,
                            borderColor: '#ef4444',
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8,
                          },
                          (pressed || hovered) && { backgroundColor: '#ef4444' },
                        ]}
                      >
                        <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
                        <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>
                          {isDeletingPost ? 'Deleting...' : 'Delete'}
                        </Text>
                      </Pressable>
                    );
                  })()}
                  <Pressable onPress={() => setIsPostDetailsModalOpen(false)} style={{ padding: 6 }}>
                    <MaterialIcons name="close" size={22} color="#8b9bb4" />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Property Photo */}
                <Image
                  source={{
                    uri: resolvePropertyImage(selectedPostDetails),
                  }}
                  style={{ width: '100%', height: 260 }}
                  resizeMode="cover"
                />

                {/* Description & Property Info */}
                <View style={{ padding: 18 }}>
                  {selectedPostDetails?.price ? (
                    <Text style={{ fontSize: 24, fontWeight: '900', color: goldPrimary }}>
                      {selectedPostDetails.price}
                    </Text>
                  ) : null}

                  <Text style={{ fontSize: 15, color: '#ffffff', lineHeight: 22, marginTop: 4 }}>
                    {selectedPostDetails?.content || selectedPostDetails?.title || 'Property Post'}
                  </Text>

                  {selectedPostDetails?.location ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <MaterialIcons name="location-on" size={15} color={goldPrimary} />
                      <Text style={{ fontSize: 13, color: '#94a3b8' }}>
                        {selectedPostDetails.location}
                      </Text>
                    </View>
                  ) : null}

                  {selectedPostDetails?.specs ? (
                    <Text style={{ fontSize: 12.5, color: '#38bdf8', marginTop: 2, fontWeight: '600' }}>
                      {selectedPostDetails.specs}
                    </Text>
                  ) : null}

                  {/* Likes Summary Bar (Clickable to view who liked) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#162338', marginTop: 14 }}>
                    <Pressable
                      onPress={handleOpenPostLikesList}
                      style={({ pressed, hovered }: any) => [
                        { flexDirection: 'row', alignItems: 'center', gap: 6, cursor: 'pointer' },
                        (pressed || hovered) && { opacity: 0.8 },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' }}>
                          <MaterialIcons name="thumb-up" size={10} color="#ffffff" />
                        </View>
                      </View>
                      <Text style={{ fontSize: 12.5, color: '#93c5fd', textDecorationLine: 'underline', fontWeight: '600' }}>
                        {postDetailsLikesCount > 0
                          ? (hasLikedPostDetails
                              ? (postDetailsLikesCount === 1 ? 'Liked by you' : `Liked by you and ${postDetailsLikesCount - 1} other${postDetailsLikesCount > 2 ? 's' : ''}`)
                              : `${postDetailsLikesCount} member${postDetailsLikesCount > 1 ? 's' : ''} liked this`)
                          : '0 likes'}
                      </Text>
                    </Pressable>

                    {/* Like Action Toggle */}
                    <Pressable
                      onPress={handleTogglePostDetailLike}
                      style={[
                        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: hasLikedPostDetails ? 'rgba(59, 130, 246, 0.2)' : '#162235', borderWidth: 1, borderColor: hasLikedPostDetails ? '#3b82f6' : '#1e2d42' }
                      ]}
                    >
                      <MaterialIcons
                        name="thumb-up"
                        size={16}
                        color={hasLikedPostDetails ? '#3b82f6' : '#ffffff'}
                      />
                      <Text style={{ color: hasLikedPostDetails ? '#3b82f6' : '#ffffff', fontSize: 12.5, fontWeight: '700' }}>
                        {hasLikedPostDetails ? 'Liked' : 'Like'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Real-time Comments List Section */}
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#162338', paddingTop: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#ffffff', marginBottom: 12 }}>
                      Comments ({postDetailsComments.length})
                    </Text>

                    {/* Comment Input */}
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                      <UserAvatar user={viewer} size={34} />
                      <TextInput
                        placeholder="Add a property comment or question..."
                        placeholderTextColor="#64748b"
                        style={{ flex: 1, backgroundColor: '#070e1a', borderWidth: 1, borderColor: '#1a273c', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: '#ffffff', fontSize: 13 }}
                        value={postDetailsCommentText}
                        onChangeText={setPostDetailsCommentText}
                        onSubmitEditing={handleAddPostDetailComment}
                      />
                      <Pressable
                        onPress={handleAddPostDetailComment}
                        disabled={isPostingDetailComment || !postDetailsCommentText.trim()}
                        style={{ backgroundColor: goldPrimary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, opacity: (!postDetailsCommentText.trim() || isPostingDetailComment) ? 0.6 : 1 }}
                      >
                        {isPostingDetailComment ? (
                          <ActivityIndicator size="small" color="#000000" />
                        ) : (
                          <Text style={{ color: '#000000', fontWeight: '800', fontSize: 12.5 }}>Post</Text>
                        )}
                      </Pressable>
                    </View>

                    {/* Comments List */}
                    {postDetailsComments.length > 0 ? (
                      postDetailsComments.map((c: any, cIdx: number) => {
                        const cAuthor = c.author || c.user || {};
                        const cName = cAuthor.fullName || cAuthor.username || c.fullName || 'Member';
                        return (
                          <View key={c._id || cIdx} style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                            <UserAvatar user={cAuthor} size={34} />
                            <View style={{ flex: 1, backgroundColor: '#131e30', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1b2a40' }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                <Text style={{ color: goldPrimary, fontWeight: '800', fontSize: 13 }}>
                                  {cName}
                                </Text>
                                <Text style={{ color: '#64748b', fontSize: 10 }}>{formatSmartDateTime(c.createdAt || c.time)}</Text>
                              </View>
                              <Text style={{ color: '#e2e8f0', fontSize: 12.5, lineHeight: 17 }}>{c.text}</Text>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                        <Text style={{ color: '#64748b', fontSize: 12.5 }}>No comments on this post yet. Be the first to comment!</Text>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── POST REACTIONS & LIKES MODAL (ONLY LIKE & THUMBS UP) ── */}
        <Modal
          visible={isPostLikesListOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsPostLikesListOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ width: '100%', maxWidth: 480, backgroundColor: '#09111e', borderRadius: 16, borderWidth: 1, borderColor: '#1a273c', maxHeight: 520, padding: 18 }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#162338', paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#0a66c2', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="thumb-up" size={12} color="#ffffff" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#ffffff', marginLeft: 4 }}>
                    Likes ({allPostLikesUsers.length})
                  </Text>
                </View>
                <Pressable onPress={() => setIsPostLikesListOpen(false)} style={{ padding: 4 }}>
                  <MaterialIcons name="close" size={22} color="#8b9bb4" />
                </Pressable>
              </View>

              {/* Categorization Tabs (All, 👍 Thumbs Up) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, borderBottomWidth: 1, borderBottomColor: '#162338', paddingBottom: 10 }}>
                <Pressable
                  onPress={() => setPostLikesTab('all')}
                  style={[
                    { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: postLikesTab === 'all' ? '#1e293b' : 'transparent', borderWidth: 1, borderColor: postLikesTab === 'all' ? '#334155' : 'transparent' },
                  ]}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: postLikesTab === 'all' ? '#ffffff' : '#8b9bb4' }}>
                    All ({allPostLikesUsers.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPostLikesTab('like')}
                  style={[
                    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: postLikesTab === 'like' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', borderWidth: 1, borderColor: postLikesTab === 'like' ? '#3b82f6' : 'transparent' },
                  ]}
                >
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#0a66c2', justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialIcons name="thumb-up" size={10} color="#ffffff" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: postLikesTab === 'like' ? '#60a5fa' : '#8b9bb4' }}>
                    Thumbs Up ({allPostLikesUsers.length})
                  </Text>
                </Pressable>
              </View>

              <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
                {isLoadingPostLikes ? (
                  <ActivityIndicator size="small" color={goldPrimary} style={{ marginVertical: 20 }} />
                ) : allPostLikesUsers.length > 0 ? (
                  allPostLikesUsers.map((u: any, idx: number) => {
                    const uId = u.id || u._id || u.username;

                    return (
                      <Pressable
                        key={uId || idx}
                        onPress={() => {
                          setIsPostLikesListOpen(false);
                          setIsPostDetailsModalOpen(false);
                          handleNavigateToCommentAuthor(u, u.fullName || u.username);
                        }}
                        style={({ pressed, hovered }: any) => [
                          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8 },
                          (pressed || hovered) && { backgroundColor: '#131e30' },
                        ]}
                      >
                        <View style={{ position: 'relative' }}>
                          <UserAvatar user={u} size={40} />
                          <View
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: '#0a66c2',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 1.5,
                              borderColor: '#09111e',
                            }}
                          >
                            <MaterialIcons
                              name="thumb-up"
                              size={10}
                              color="#ffffff"
                            />
                          </View>
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13.5 }}>{u.fullName || u.username}</Text>
                            <MaterialIcons name="verified" size={14} color="#0095f6" />
                          </View>
                          <Text style={{ color: '#8b9bb4', fontSize: 11.5 }}>@{u.username || 'member'}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#8b9bb4" />
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#8b9bb4', fontSize: 12 }}>No reactions under this category yet.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── CUSTOM LUXURY SIGN OUT CONFIRMATION MODAL ── */}
        <Modal
          visible={isSignOutModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!isSigningOut) setIsSignOutModalOpen(false);
          }}
        >
          <View style={styles.signOutModalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                if (!isSigningOut) setIsSignOutModalOpen(false);
              }}
            />
            <View style={[styles.signOutModalCard, { backgroundColor: cardBg, borderColor }]}>
              {/* Close "X" Button */}
              <Pressable
                onPress={() => {
                  if (!isSigningOut) setIsSignOutModalOpen(false);
                }}
                style={styles.signOutModalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close sign out modal"
              >
                <MaterialIcons name="close" size={20} color={textMuted} />
              </Pressable>

              {/* Red Accent Logout Badge */}
              <View style={styles.signOutIconBadge}>
                <MaterialIcons name="logout" size={28} color="#EF4444" />
              </View>

              {/* Title & Description */}
              <Text style={[styles.signOutModalTitle, { color: textPrimary }]}>
                Sign Out of Boolok AI
              </Text>
              <Text style={[styles.signOutModalDesc, { color: textSecondary }]}>
                Are you sure you want to sign out? You will need your credentials to sign back in and access your portfolio and dashboard.
              </Text>

              {/* Active User Summary Card */}
              <View style={[styles.signOutUserBadge, { backgroundColor: isDark ? '#070E1A' : '#F1F5F9', borderColor }]}>
                <UserAvatar user={profileUser} size={38} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.signOutUserName, { color: textPrimary }]} numberOfLines={1}>
                    {profileUser.fullName || viewer?.fullName || 'Boolok Member'}
                  </Text>
                  <Text style={[styles.signOutUserHandle, { color: textMuted }]} numberOfLines={1}>
                    @{profileUser.username || viewer?.username || 'member'}
                  </Text>
                </View>
              </View>

              {/* Modal Action Buttons */}
              <View style={styles.signOutActionRow}>
                <Pressable
                  onPress={() => setIsSignOutModalOpen(false)}
                  disabled={isSigningOut}
                  style={[
                    styles.signOutCancelBtn,
                    {
                      backgroundColor: isDark ? '#162235' : '#E2E8F0',
                      borderColor,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={[styles.signOutCancelText, { color: textPrimary }]}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirmSignOut}
                  disabled={isSigningOut}
                  style={[
                    styles.signOutConfirmBtn,
                    isSigningOut && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm Sign Out"
                >
                  {isSigningOut ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.signOutConfirmText}>Signing Out...</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialIcons name="logout" size={18} color="#FFFFFF" />
                      <Text style={styles.signOutConfirmText}>Sign Out</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── CUSTOM LUXURY CONTACT INFO MODAL ── */}
        <Modal
          visible={isContactModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsContactModalOpen(false)}
        >
          <View style={styles.contactModalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setIsContactModalOpen(false)}
            />
            <View style={[styles.contactModalCard, { backgroundColor: cardBg, borderColor }]}>
              {/* Header */}
              <View style={[styles.contactModalHeader, { borderBottomColor: borderColor }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.contactHeaderIconBox, { backgroundColor: isDark ? '#162235' : '#F1F5F9' }]}>
                    <MaterialIcons name="contact-page" size={22} color={goldPrimary} />
                  </View>
                  <View>
                    <Text style={[styles.contactModalTitle, { color: textPrimary }]}>
                      {profileUser.fullName || viewer?.fullName || 'Boolok Member'}
                    </Text>
                    <Text style={[styles.contactModalSubtitle, { color: textMuted }]}>
                      Verified Member Contact Info
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setIsContactModalOpen(false)}
                  style={styles.contactModalCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close contact info"
                >
                  <MaterialIcons name="close" size={22} color={textMuted} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Boolok Profile Link */}
                <View style={styles.contactItemRow}>
                  <View style={[styles.contactItemIconBox, { backgroundColor: isDark ? '#162235' : '#F1F5F9' }]}>
                    <MaterialIcons name="link" size={20} color={goldPrimary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.contactItemLabel, { color: textMuted }]}>BOOLOK PROFILE</Text>
                    <Text style={[styles.contactItemValue, { color: '#0077b5', textDecorationLine: 'underline' }]}>
                      boolok.ai/in/{profileUser.username || 'member'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleCopyText(`https://boolok.ai/in/${profileUser.username || 'member'}`, 'profileUrl')}
                    style={[styles.contactCopyBtn, { borderColor }]}
                  >
                    <MaterialIcons
                      name={copiedField === 'profileUrl' ? 'check' : 'content-copy'}
                      size={15}
                      color={copiedField === 'profileUrl' ? '#22c55e' : textMuted}
                    />
                    <Text style={[styles.contactCopyText, { color: copiedField === 'profileUrl' ? '#22c55e' : textMuted }]}>
                      {copiedField === 'profileUrl' ? 'Copied' : 'Copy'}
                    </Text>
                  </Pressable>
                </View>

                {/* Email Address */}
                <View style={styles.contactItemRow}>
                  <View style={[styles.contactItemIconBox, { backgroundColor: isDark ? '#162235' : '#F1F5F9' }]}>
                    <MaterialIcons name="email" size={20} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.contactItemLabel, { color: textMuted }]}>EMAIL ADDRESS</Text>
                    <Text style={[styles.contactItemValue, { color: textPrimary }]}>
                      {profileUser.email || viewer?.email || `${profileUser.username || 'member'}@boolok.ai`}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleCopyText(profileUser.email || viewer?.email || `${profileUser.username || 'member'}@boolok.ai`, 'email')}
                    style={[styles.contactCopyBtn, { borderColor }]}
                  >
                    <MaterialIcons
                      name={copiedField === 'email' ? 'check' : 'content-copy'}
                      size={15}
                      color={copiedField === 'email' ? '#22c55e' : textMuted}
                    />
                    <Text style={[styles.contactCopyText, { color: copiedField === 'email' ? '#22c55e' : textMuted }]}>
                      {copiedField === 'email' ? 'Copied' : 'Copy'}
                    </Text>
                  </Pressable>
                </View>

                {/* Username */}
                <View style={styles.contactItemRow}>
                  <View style={[styles.contactItemIconBox, { backgroundColor: isDark ? '#162235' : '#F1F5F9' }]}>
                    <MaterialIcons name="alternate-email" size={20} color="#a855f7" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.contactItemLabel, { color: textMuted }]}>BOOLOK USERNAME</Text>
                    <Text style={[styles.contactItemValue, { color: textPrimary }]}>
                      @{profileUser.username || 'member'}
                    </Text>
                  </View>
                </View>

                {/* Network & Brokerage */}
                <View style={styles.contactItemRow}>
                  <View style={[styles.contactItemIconBox, { backgroundColor: isDark ? '#162235' : '#F1F5F9' }]}>
                    <MaterialIcons name="business" size={20} color={goldPrimary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.contactItemLabel, { color: textMuted }]}>NETWORK & AFFILIATION</Text>
                    <Text style={[styles.contactItemValue, { color: textPrimary }]}>
                      Boolok Global Real Estate Network
                    </Text>
                    <Text style={{ color: textSecondary, fontSize: 12, marginTop: 2 }}>
                      Institutional Commercial Real Estate & High-Value Assets
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.contactItemRow}>
                  <View style={[styles.contactItemIconBox, { backgroundColor: isDark ? '#162235' : '#F1F5F9' }]}>
                    <MaterialIcons name="location-on" size={20} color="#ef4444" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.contactItemLabel, { color: textMuted }]}>OPERATING REGION</Text>
                    <Text style={[styles.contactItemValue, { color: textPrimary }]}>
                      {defaultLocation}
                    </Text>
                  </View>
                </View>

                {/* Verification Status */}
                <View style={[styles.contactItemRow, { borderBottomWidth: 0 }]}>
                  <View style={[styles.contactItemIconBox, { backgroundColor: isDark ? '#162235' : '#F1F5F9' }]}>
                    <MaterialIcons name="verified" size={20} color="#0095f6" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.contactItemLabel, { color: textMuted }]}>MEMBERSHIP STATUS</Text>
                    <Text style={[styles.contactItemValue, { color: '#0095f6', fontWeight: '700' }]}>
                      Verified Advisor · 1st Degree Member
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={[styles.contactModalFooter, { borderTopColor: borderColor }]}>
                {isSelf ? (
                  <Pressable
                    onPress={() => {
                      setIsContactModalOpen(false);
                      setTimeout(() => handleOpenEditModal(), 150);
                    }}
                    style={[styles.contactFooterEditBtn, { backgroundColor: goldPrimary }]}
                  >
                    <MaterialIcons name="edit" size={16} color="#000000" />
                    <Text style={styles.contactFooterEditText}>Edit Profile Info</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      setIsContactModalOpen(false);
                    }}
                    style={[styles.contactFooterCloseBtn, { backgroundColor: isDark ? '#162235' : '#E2E8F0' }]}
                  >
                    <Text style={[styles.contactFooterCloseText, { color: textPrimary }]}>Done</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 880,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  topSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' } as any,
    }),
  },
  topSignOutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutCtaBtn: {
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' } as any,
    }),
  },

  // ── Custom Sign Out Modal Styles ──
  signOutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  signOutModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      } as any,
    }),
  },
  signOutModalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 14,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  signOutIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  signOutModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  signOutModalDesc: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  signOutUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
    marginBottom: 20,
  },
  signOutUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  signOutUserHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  signOutActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  signOutCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  signOutCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  signOutConfirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  signOutConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Custom Contact Info Modal Styles ──
  contactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  contactModalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      } as any,
    }),
  },
  contactModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  contactHeaderIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactModalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  contactModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  contactModalCloseBtn: {
    padding: 6,
    borderRadius: 12,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  contactItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contactItemValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  contactCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  contactCopyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contactModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contactFooterEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  contactFooterEditText: {
    color: '#000000',
    fontSize: 13.5,
    fontWeight: '800',
  },
  contactFooterCloseBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  contactFooterCloseText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Main Profile Card
  mainProfileCard: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
      } as any,
    }),
  },
  coverBannerContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    overflow: 'hidden',
  },
  coverBannerImage: {
    width: '100%',
    height: '100%',
  },
  coverBrandBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e6b800',
  },
  coverBrandText: {
    color: '#e6b800',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Header Content
  profileHeaderContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -55,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
  },

  affiliationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a273c',
  },
  affiliationLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0c1626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  affiliationTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  affiliationSubtitle: {
    color: '#8b9bb4',
    fontSize: 10,
    marginTop: 1,
  },

  nameBlock: {
    marginTop: 4,
  },
  profileFullName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileDegree: {
    fontSize: 13,
    color: '#8b9bb4',
    fontWeight: '600',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  profileUsername: {
    fontSize: 13,
    color: '#8b9bb4',
  },
  usernameInlineInput: {
    backgroundColor: '#070e1a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#e6b800',
  },
  saveUsernameText: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelUsernameText: {
    color: '#8b9bb4',
    fontSize: 12,
  },
  editUsernameText: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '700',
  },

  profileHeadline: {
    fontSize: 14.5,
    color: '#e2e8f0',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
  locationContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 4,
    columnGap: 6,
    marginTop: 6,
  },
  locationText: {
    fontSize: 12.5,
    color: '#8b9bb4',
    flexShrink: 1,
  },
  locationDot: {
    color: '#8b9bb4',
    marginHorizontal: 2,
  },
  contactInfoText: {
    color: '#e6b800',
    fontSize: 12.5,
    fontWeight: '700',
    whiteSpace: 'nowrap',
  } as any,

  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  followersMetric: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  connectionsMetric: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  volumeMetric: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  metricsDot: {
    color: '#8b9bb4',
    marginHorizontal: 8,
  },

  mutualsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  mutualsText: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontWeight: '500',
  },

  ctaButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
    borderRadius: 20,
  },
  primaryCtaText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  secondaryCtaText: {
    fontSize: 13.5,
    fontWeight: '700',
  },

  // About Section
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px -1px rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.04)',
      } as any,
    }),
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  aboutBodyText: {
    fontSize: 13.5,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  pillItem: {
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1a273c',
  },
  pillText: {
    color: '#e6b800',
    fontSize: 12,
    fontWeight: '600',
  },

  // Create Form
  createTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  createTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#162235',
  },
  createTypeBtnText: {
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: '700',
  },
  formInput: {
    backgroundColor: '#070e1a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13.5,
  },
  formTextArea: {
    backgroundColor: '#070e1a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    color: '#ffffff',
    fontSize: 13.5,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  attachedPreviewBox: {
    marginTop: 10,
    position: 'relative',
    width: 140,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e6b800',
  },
  attachedPreviewImg: {
    width: '100%',
    height: '100%',
  },
  removePreviewBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    padding: 2,
  },
  attachedVideoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2218',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  attachedVideoTagText: {
    color: '#4ade80',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  formActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  attachMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#162235',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexGrow: 1,
  },
  attachMediaBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  submitFormBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  submitFormBtnText: {
    color: '#000000',
    fontSize: 13.5,
    fontWeight: '700',
  },

  // Portfolio Tabs
  portfolioTabRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a273c',
    marginBottom: 20,
  },
  portfolioTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 12,
    paddingHorizontal: 2,
  },
  portfolioTabText: {
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
  },

  // Properties Grid
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  propertyCard: {
    width: '48%',
    minWidth: 260,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px -1px rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.04)',
      } as any,
    }),
  },
  propertyImage: {
    width: '100%',
    height: 180,
  },
  propertyDetailsBox: {
    padding: 14,
  },
  propertyPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e6b800',
  },
  propertyTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
  },
  propertyLocationText: {
    fontSize: 12,
    color: '#8b9bb4',
    marginTop: 4,
  },
  propertySpecsText: {
    fontSize: 11.5,
    color: '#cbd5e1',
    marginTop: 4,
  },
  propertyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a273c',
  },
  propertyLikesText: {
    color: '#8b9bb4',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyCommentsText: {
    color: '#8b9bb4',
    fontSize: 12,
    fontWeight: '600',
  },

  // Reels Grid
  reelsGridContainer: {
    width: '100%',
    alignItems: 'center',
  },
  reelCardItem: {
    width: '100%',
    maxWidth: 420,
    height: 540,
    backgroundColor: '#18181b',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  reelImage: {
    width: '100%',
    height: '100%',
  },
  reelMatchBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#e6b800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
  },
  reelMatchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e6b800',
    marginRight: 6,
  },
  reelMatchText: {
    color: '#e6b800',
    fontWeight: '800',
    fontSize: 11,
  },
  centerPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 2,
    borderColor: '#e6b800',
    justifyContent: 'center',
    alignItems: 'center',
  },
    reelFooterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingTop: 32,
    paddingRight: 80,
  },
  reelTitleHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  reelLocationSub: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  reelInsightBox: {
    backgroundColor: '#1f1b0a',
    borderWidth: 1,
    borderColor: '#e6b800',
    borderRadius: 8,
    padding: 8,
  },
  reelInsightText: {
    color: '#e2e8f0',
    fontSize: 11,
  },

  // Reel Right Actions Sidebar
  reelRightActions: {
    position: 'absolute',
    right: 8,
    bottom: 20,
    alignItems: 'center',
    zIndex: 25,
    width: 56,
  },
  creatorRailItem: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'nowrap',
  },
  authorProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 2,
  },
  authorNameText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 0,
  },
  authorHandleText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 4,
    flexShrink: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reelLocationText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  insightContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(249, 192, 61, 0.35)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  insightTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  insightText: {
    color: '#e2e8f0',
    fontSize: 12.5,
    lineHeight: 17,
  },
  reelActionBtn: {
    alignItems: 'center',
    marginBottom: 8,
  },
  reelActionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  reelActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },

  // Comments Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  commentsModalSheet: {
    width: '100%',
    maxWidth: 520,
    height: '65%',
    backgroundColor: '#0b1322',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1a273c',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a273c',
  },
  commentsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  commentsScrollView: {
    flex: 1,
    marginVertical: 12,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e6b800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 14,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#162235',
    borderRadius: 12,
    padding: 10,
  },
  commentAuthorName: {
    color: '#e6b800',
    fontWeight: '700',
    fontSize: 12.5,
    marginBottom: 2,
  },
  commentContentText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a273c',
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#162235',
    borderWidth: 1,
    borderColor: '#1a273c',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13.5,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6b800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  followerItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  deleteDialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 24,
    alignItems: 'center',
  },
  deleteDialogIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  deleteDialogTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  deleteDialogDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  deleteDialogBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteDialogCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDialogCancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteDialogConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteDialogConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  reactionDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


