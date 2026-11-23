'use strict';
/* ---- 物ごとの「らしさ」：名前と能力の材料 ----
   名前の作り方は、モンスター名の作り方（ポケモンの名前の研究など）を参考にした：
   ・2つの言葉を合わせる（フシギダネ＝ふしぎ＋たね、ヒトカゲ＝ひ＋とかげ）
   ・その物の音やようすを表すことば（擬音語・擬態語）を使う（ぽちゃん→ポッチャマ、ころころ→コロボーシ）
   ・音のイメージ：にごった音（ガ・ザ・ダ・バ）が多く、長い名前ほど「大きい・重い・強い」。空を飛ぶものはサ行が合う
     （Kawahara ほか「ポケモン名の音象徴」）。まるい形はボ・モ・ウ、とがった形はキ・ト・イ（ブーバ／キキ効果）
*/
// 物の擬音語・ようすのことば（1つめ＝くり返せることば、2つめ＝名前の材料）
const RK_MIM={};
('flashlight:ピカ/ライト belt:ギュ/バックル mushroom:ポコ/キノ pond:チャプ/ポチャ strawberry:ツブ/イチゴ pineapple:トゲ/パイン sun:ギラ/ポカ cow:モー/ウシ ear:ピク/ミミ '+
 'bush:ガサ/モサ pliers:ギリ/ペンチ watermelon:シャリ/スイカ apple:シャキ/リンゴ baseball:カキン/ボール feather:フワ/ハネ shoe:コツ/クツ leaf:ヒラ/ハッパ lollipop:ペロ/アメ '+
 'crown:キラ/オウ ocean:ザブ/ナミ horse:パカ/ヒヒン mountain:ゴゴ/ヤマ mosquito:プン/チク mug:ホカ/マグ hospital:ピポ/ケア saw:ギコ/ギザ castle:ドド/シロ angel:フワ/エル '+
 'underwear:ヒラ/パンツ traffic_light:チカ/シグナル cruise_ship:ボー/フネ marker:キュ/マーク blueberry:ツブ/ベリー flamingo:フラ/ピンク face:ニコ/カオ hockey_stick:カツ/スティック '+
 'bucket:ジャブ/バケツ campfire:メラ/パチ asparagus:シャキ/アスパラ skateboard:ゴロ/スケボ door:ガチャ/トビラ suitcase:ガラ/カバン skull:カタ/ドクロ cloud:モク/フワ '+
 'paint_can:ベタ/ペンキ hockey_puck:カツ/パック steak:ジュウ/ニク house_plant:スク/ハチウエ sleeping_bag:ヌク/スヤ bench:ドカ/ベンチ snowman:コロ/ユキ arm:ムキ/ウデ '+
 'crayon:グリ/クレヨン fan:ブン/カゼ shovel:ザク/ホリ leg:スタ/アシ washing_machine:ゴウ/アワ harp:ポロ/ハープ toothbrush:シャカ/ハブラシ tree:ザワ/キギ bear:ノシ/クマ '+
 'rake:カリ/クマデ megaphone:ワア/メガホン knee:ガク/ヒザ guitar:ジャン/ギター calculator:ピポ/ケイサン hurricane:ゴウ/アラシ grapes:プチ/ブドウ paintbrush:サラ/フデ '+
 'couch:フカ/ソファ nose:クン/ハナ square:カク/シカク wristwatch:チク/トケイ penguin:ペタ/ペンギン bridge:カン/ハシ octagon:カク/ハッカク submarine:ゴボ/センスイ '+
 'screwdriver:クル/ネジ rollerskates:シャー/ローラー ladder:トン/ハシゴ wine_bottle:トク/ビン cake:フワ/ケーキ bracelet:キラ/ワッカ broom:サッサ/ホウキ yoga:グニ/ヨガ '+
 'finger:ツン/ユビ fish:ピチ/ギョ line:スー/セン truck:ブロ/トラック snake:ニョロ/ヘビ bus:ブブ/バス stitches:チク/ヌイメ snorkel:ブク/モグリ shorts:スカ/ズボン '+
 'bowtie:キュ/タイ pickup_truck:ブロ/トラック tooth:ガチ/キバ snail:ノロ/カタツムリ foot:ドス/アシ crab:チョキ/カニ school_bus:ブブ/バス train:ガタ/シュッポ dresser:ガタ/タンス '+
 'sock:ホカ/クツシタ tractor:ドド/トラクタ map:ガサ/チズ hedgehog:チク/ハリ coffee_cup:ホッ/カフェ computer:カタ/ピコ matches:シュッ/マッチ beard:モジャ/ヒゲ frog:ケロ/ゲコ '+
 'crocodile:ガブ/ワニ bathtub:ザブ/オフロ rain:ザア/ポツ moon:ツキ/ルナ bee:ブン/ハチ knife:スパ/ナイフ boomerang:ヒュン/ブーメラン lighthouse:ピカ/トウダイ chandelier:キラ/シャンデ '+
 'jail:ガシャ/ロウヤ pool:チャプ/プール stethoscope:トクン/ドクン frying_pan:ジュウ/パン cell_phone:ピロ/スマホ binoculars:ジー/メガネ purse:チャリ/サイフ lantern:ポウ/アカリ '+
 'birthday_cake:ワイ/ケーキ clarinet:ピー/クラリネ palm_tree:ユラ/ヤシ aircraft_carrier:ゴゴ/クウボ vase:コト/カビン eraser:ゴシ/ケシゴム shark:ガブ/サメ skyscraper:ズン/ビル '+
 'bicycle:チリン/リンリン sink:ジャー/シンク teapot:コポ/ポット circle:クル/マル tornado:ゴウ/ウズ bird:ピヨ/チュン stereo:ズン/オンキョウ mouth:パク/クチ key:カチ/カギ '+
 'hot_dog:ホク/ドッグ spoon:スク/サジ laptop:カタ/パソコン cup:ゴク/コップ bottlecap:ポン/フタ The_Great_Wall_of_China:ドド/ジョウヘキ The_Mona_Lisa:ニコ/モナ smiley_face:ニコ/スマイル '+
 'waterslide:ザザ/スライダー eyeglasses:キラ/メガネ ceiling_fan:クル/ファン lobster:チョキ/エビ moustache:ピン/ヒゲ carrot:ポリ/ニンジン garden:サワ/ニワ police_car:ウー/パトカ '+
 'postcard:ペラ/ハガキ necklace:キラ/ネックレ helmet:カン/メット blackberry:ツブ/ベリー beach:ザザ/スナ golf_club:カン/ゴルフ car:ブン/ブーブ panda:コロ/パンダ alarm_clock:ジリ/メザマシ '+
 't-shirt:パサ/シャツ dog:ワン/ワフ bread:フカ/パン wine_glass:チン/グラス lighter:カチ/ボッ flower:ポワ/ハナ bandage:ペタ/テープ drill:ギュイ/ドリル butterfly:ヒラ/パピヨン '+
 'swan:スイ/スワン owl:ホウ/フクロ raccoon:ゴシ/アライ squiggle:クネ/ニョロ calendar:ペラ/コヨミ giraffe:ノビ/キリン elephant:パオ/ゾウ trumpet:パパ/ラッパ rabbit:ピョン/ウサ '+
 'trombone:ボー/ラッパ sheep:メエ/モコ onion:ツン/タマネギ church:カーン/カネ flip_flops:ペタ/サンダル spreadsheet:カタ/ヒョウ pear:シャリ/ナシ clock:チク/タク roller_coaster:ゴー/コースター '+
 'parachute:フワ/パラ kangaroo:ピョン/ルー duck:ガア/アヒル remote_control:ピッ/リモコン compass:クル/ハリ monkey:ウキ/サル rainbow:キラ/ニジ tennis_racquet:パコ/ラケット lion:ガオ/レオ '+
 'pencil:カリ/エンピツ string_bean:シャキ/サヤ oven:チン/ホカ star:キラ/ホシ cat:ニャン/ニャ pizza:トロ/ピザ soccer_ball:ポン/ボール syringe:チク/チュウシャ flying_saucer:ピロ/ユーフォー '+
 'eye:ジー/ギョロ cookie:サク/クッキー floor_lamp:ポウ/ランプ mouse:チュウ/チュ toilet:ジャー/トイレ toaster:チン/パン The_Eiffel_Tower:ツン/エッフェル airplane:ブーン/ヒコウ stove:ボッ/コンロ '+
 'cello:ボロン/チェロ stop_sign:ピタ/トマレ tent:パタ/テント diving_board:ボヨン/ダイブ light_bulb:ピカ/ピコ hammer:トン/カン scorpion:チク/サソリ headphones:ズン/ヘッドホン basket:カゴ/ザル '+
 'spider:カサ/クモ paper_clip:パチ/クリップ sweater:モコ/ニット ice_cream:ヒヤ/トロ envelope:ペラ/フウトウ sea_turtle:ノソ/カメ donut:モチ/ドーナツ hat:ポフ/ボウシ hourglass:サラ/スナ '+
 'broccoli:モサ/ブロッコ jacket:バサ/ジャケット backpack:ドサ/リュック book:ペラ/ホン lightning:ゴロ/ピシャ drums:ドン/ドコ snowflake:シン/ユキ radio:ザザ/ラジオ banana:ムキ/バナナ '+
 'camel:ノシ/ラクダ canoe:スイ/カヌー toothpaste:ニュル/ハミガキ chair:ガタ/イス picture_frame:カチ/ガクブチ parrot:ペチャ/オウム sandwich:ハム/サンド lipstick:ヌリ/ベニ pants:スタ/ズボン '+
 'violin:キュ/バイオリン brain:ピコ/ノウ power_outlet:ビリ/コンセント triangle:トン/サンカク hamburger:ガブ/バーガー dragon:ゴウ/ドラ cannon:ドン/タイホウ dolphin:キュイ/イルカ zebra:シマ/ゼブラ '+
 'animal_migration:ドド/ムレ camouflage:コソ/カモフラ scissors:チョキ/ハサミ basketball:ダム/ダンク elbow:ゴツ/ヒジ umbrella:パラ/カサ windmill:クル/フウシャ table:ドン/ツクエ rifle:バン/ズドン '+
 'hexagon:カク/ロッカク potato:ホク/イモ anvil:カン/ゴン sword:シャキ/ツルギ peanut:カリ/マメ axe:ザク/オノ television:ザザ/テレビ rhinoceros:ドス/サイ baseball_bat:カキン/バット '+
 'speedboat:ザバ/ボート sailboat:スイ/ヨット zigzag:ギザ/ジグザ garden_hose:シャー/ホース river:サラ/カワ house:ホッコ/イエ pillow:フカ/マクラ ant:テク/アリ tiger:ガル/トラ stairs:トン/カイダン '+
 'cooler:ヒヤ/クーラー see_saw:ギッ/シーソー piano:ポロ/ピアノ fireplace:パチ/ダンロ popsicle:ヒヤ/シャリ dumbbell:ムキ/ダンベル mailbox:ポス/ポスト barn:モー/コヤ hot_tub:ポカ/ユケムリ '+
 'teddy-bear:モフ/テディ fork:サク/フォーク dishwasher:ジャブ/アワ peas:コロ/マメ hot_air_balloon:フワ/バルーン keyboard:カタ/キー microwave:チン/レンジ wheel:クル/ワ fire_hydrant:ジャー/ショウカ '+
 'van:ブロ/ワゴン camera:パシャ/カメラ whale:ザブ/クジラ candle:ユラ/ロウソク octopus:ニュル/タコ pig:ブウ/ブタ swing_set:ブラ/ブランコ helicopter:バラ/ヘリ saxophone:ブォ/サックス '+
 'passport:ペタ/パスポ bat:バサ/コウモリ ambulance:ピーポ/キュウ diamond:キラ/ダイヤ goatee:チョビ/ヒゲ fence:ガシ/サク grass:サワ/クサ mermaid:チャプ/マーメイ motorbike:ブォン/バイク '+
 'microphone:マイ/エコー cactus:チク/サボテン nail:カン/クギ telephone:リン/デンワ hand:ペチ/テ squirrel:カリ/リス streetlight:ポウ/ガイトウ bed:スヤ/ネムリ firetruck:ウー/ショウボウ '+
 'person_walking:テク/ホコ person_sitting:チョコ/スワリ head:ゴチ/アタマ skeleton:カタ/ホネ santa_claus:ホウ/サンタ bell:リン/カラン blimp:フワ/ヒコウセン bowl:コト/オワン crane:ギギ/クレーン '+
 'microscope:ジー/ミクロ present:ワク/ギフト pumpkin:ゴロ/カボチャ race_car:ブォン/レース rooster:コケ/トサカ satellite:ピコ/エイセイ space_shuttle:ゴゴ/シャトル tomato:プチ/トマト '+
 'wheelbarrow:ガラ/クルマ snowboard:シャー/スノボ bookshelf:ズラ/ホンダナ loudspeaker:ズン/スピーカ comb:サラ/クシ pretzel:カリ/プレッツ satellite_dish:ピコ/パラボラ stapler:パチ/ホチキス '+
 'heart:ドキ/ハート infinity:クル/ムゲン check:ピッ/チェック cross:バツ/クロス male:ガツ/ボーイ female:キラ/ガール money:チャリ/キン music:ララ/ルン nothing:シーン/カラ arrow:ヒュン/ヤ'
).split(' ').forEach(s=>{const[k,v]=s.split(':');RK_MIM[k]=v.split('/')});

/* 性質（タグ）：能力・必殺技の選び方と、技の名前のことば
   res=出やすい共鳴効果  sp=出やすい必殺技  lean=ATK寄りかHP寄りか  el=属性のもと
   a=1体への攻撃技  b=全体技  f=プレイヤーへの技  k=とどめ技  h=回復技  r={共鳴効果:名前}  kana=名前の頭  role=分類 */
const RK_TAG={
  claw:{res:['atk1','pierce','haste'],sp:['flare','gale','starfall'],lean:'atk',a:['クロー','ひっかき','かみつき'],b:['あばれまわり'],f:['とびかかり'],k:['とどめのキバ'],r:{atk1:'のやせいのほんのう',pierce:'のするどいキバ',haste:'のとびかかり'},kana:['キバ','ツメ'],role:'けもの'},
  horn:{res:['atk1','pierce'],sp:['raikou','starfall'],lean:'atk',a:['ホーンアタック','つのでつく'],f:['とっしん'],r:{atk1:'のいきりたつ',pierce:'のつきやぶる'},kana:['ツノ'],role:'つののけもの'},
  poison:{res:['burnOnDeath','thorn','gaugeOnDeath'],sp:['reap','flare'],lean:'atk',a:['どくばり','ポイズン'],k:['もうどく'],f:['どくのきり'],r:{burnOnDeath:'のさいごのどく',thorn:'のどくのトゲ'},kana:['ドク'],role:'どくつかい'},
  spike:{res:['thorn','burnOnDeath','drSelf'],sp:['flare','gale'],lean:'atk',a:['トゲとばし','ニードル'],b:['トゲのあめ'],r:{thorn:'のさわるとチクリ',burnOnDeath:'のさいごのトゲ'},kana:['トゲ','ハリ'],role:'とげのけもの'},
  shell:{res:['drSelf','drAdj','regen'],sp:['sanctuary','drop'],lean:'hp',a:['たいあたり','シェルアタック'],h:['からのなかでひとやすみ'],r:{drSelf:'のからにこもる',drAdj:'のかたいたて'},kana:['カラ','コウラ'],role:'まもりて'},
  heavy:{res:['drSelf','regen','drAdj'],sp:['tsunami','gigabolt','starfall'],lean:'hp',a:['のしかかり','ヘビープレス'],b:['じならし','じしん'],r:{drSelf:'のどっしりからだ',regen:'のタフネス'},kana:['オオ','ドッシ'],role:'きょじん'},
  fly:{res:['haste','gaugeStart','drawOnDeath'],sp:['gale','raikou'],lean:'atk',a:['エアスラッシュ','ダイブ','つばさうち'],f:['きゅうこうか','そらからのいちげき'],b:['はばたきのかぜ'],r:{haste:'のはやわざ',gaugeStart:'のそらのめ'},kana:['ハネ','ソラ'],role:'そらのたみ'},
  swim:{res:['regen','drawOnDeath','drAdj'],sp:['flare','tsunami','drop'],lean:'',a:['みずでっぽう','アクアジェット'],b:['なみのり','うずしお'],h:['みずあび'],r:{regen:'のうるおいボディ',drawOnDeath:'のうみのめぐみ'},kana:['ミズ','ナミ'],role:'うみのたみ'},
  fire:{res:['atk1','burnOnDeath'],sp:['flare','gigabolt','starfall'],lean:'atk',el:'fire',a:['ブレス','ほのおだま','フレイム'],b:['やきつくす','だいふんか'],f:['ひばしら'],r:{atk1:'のもえあがる',burnOnDeath:'のさいごのひばな'},kana:['ヒ','ホムラ'],role:'ほのおのせい'},
  ice:{res:['drSelf','drAdj','gaugeStart'],sp:['tsunami','starfall','flare'],lean:'hp',el:'water',a:['つららおとし','こおりのいき'],b:['ブリザード','ふぶき'],r:{drSelf:'のこおりのよろい',drAdj:'のこおりのかべ'},kana:['コオリ','ユキ'],role:'こおりのせい'},
  elec:{res:['gaugeStart','haste','atk1'],sp:['raikou','gigabolt','flare'],lean:'atk',el:'thunder',a:['でんげき','スパーク'],b:['ほうでん','ギガスパーク'],f:['らくらい','ボルトショット'],r:{gaugeStart:'のじゅうでん',haste:'のでんこうせっか'},kana:['ピカ','ビリ'],role:'いかずちのせい'},
  wind:{res:['haste','atk1','gaugeStart'],sp:['gale','tsunami','raikou'],lean:'',a:['かまいたち','ウインドカッター'],b:['たつまき','だいあらし'],f:['とっぷう'],r:{haste:'のおいかぜ',atk1:'のむかいかぜ'},kana:['カゼ','ソヨ'],role:'かぜのせい'},
  plant:{res:['regen','healEnd','lifeStart'],sp:['bloom','drop','sanctuary'],lean:'hp',el:'forest',a:['はっぱカッター','つるのムチ','タネマシンガン'],h:['こうごうせい','はなのいやし'],r:{regen:'のこうごうせい',healEnd:'のもりのいぶき',lifeStart:'のめぶき'},kana:['ハッパ','タネ','ツル'],role:'もりのたみ'},
  heal:{res:['healEnd','lifeOnDeath','lifeStart'],sp:['drop','sanctuary','aurora'],lean:'hp',el:'light',a:['やさしいいちげき'],h:['いやしのひかり','てあて','おまじない'],r:{healEnd:'のいやしのうた',lifeOnDeath:'のおまもり',lifeStart:'のやさしいきもち'},kana:['ヤサ','イヤシ'],role:'いやしびと'},
  sweet:{res:['lifeStart','lifeOnDeath','healEnd'],sp:['bloom','drop'],lean:'hp',a:['シュガーラッシュ','クリームなげ'],h:['おやつタイム','あまいかおり'],r:{lifeStart:'のおやつタイム',lifeOnDeath:'のおすそわけ'},kana:['アマ','オヤツ'],role:'おかしのせい'},
  food:{res:['lifeStart','regen','lifeOnDeath'],sp:['bloom','drop','flare'],lean:'hp',a:['あつあつアタック','まるかじり'],h:['いただきます','まんぷく'],r:{lifeStart:'のいただきます',regen:'のおかわり'},kana:['ハラペコ','モグ'],role:'たべもの'},
  shine:{res:['gaugeStart','lifeStart','drAdj'],sp:['starfall','aurora','raikou'],lean:'',el:'light',a:['ひかりのや','シャイン'],b:['ひかりのあめ'],f:['フラッシュ'],h:['あさひのめぐみ'],r:{gaugeStart:'のきらめき',lifeStart:'のあさひ'},kana:['キラ','ヒカリ'],role:'ひかりのせい'},
  dark:{res:['gaugeOnDeath','burnOnDeath','drawOnDeath'],sp:['reap','starfall'],lean:'atk',el:'dark',a:['シャドウ','やみうち'],k:['しのせんこく','たましいがり'],f:['のろい'],r:{gaugeOnDeath:'ののこるおもい',burnOnDeath:'ののろい'},kana:['ヤミ','カゲ'],role:'やみのたみ'},
  night:{res:['gaugeStart','burnOnDeath'],sp:['reap','starfall'],lean:'',el:'dark',a:['つきあかりのや','ナイトメア'],k:['よるのかり'],r:{gaugeStart:'のよみとおし'},kana:['ヨル','ツキ'],role:'よるのたみ'},
  tech:{res:['gaugeStart','drAdj','atk1'],sp:['raikou','gigabolt','flare'],lean:'',el:'thunder',a:['ビーム','レーザー'],b:['フルバースト','システムダウン'],f:['ミサイル'],r:{gaugeStart:'のフルチャージ',drAdj:'のバリア'},kana:['メカ','ギア'],role:'からくり'},
  speed:{res:['haste','atk1'],sp:['raikou','gale'],lean:'atk',a:['とっしん','ブースト'],f:['フルスロットル','ひきにげ'],r:{haste:'のスタートダッシュ',atk1:'のトップスピード'},kana:['ハヤ','ビュン'],role:'はしりや'},
  blade:{res:['pierce','atk1'],sp:['starfall','gale','reap'],lean:'atk',a:['いっせん','スラッシュ','きりさく'],k:['とどめのひとふり'],r:{pierce:'のきれあじ',atk1:'のとぎすます'},kana:['ヤイバ','キレ'],role:'けんし'},
  shoot:{res:['pierce','burnOnDeath'],sp:['raikou','flare'],lean:'atk',a:['ショット','ねらいうち'],f:['ちょくげき','スナイプ'],r:{pierce:'のつらぬくたま'},kana:['タマ','ネライ'],role:'うちて'},
  tool:{res:['drAdj','drawOnDeath','atk1'],sp:['flare','raikou'],lean:'',a:['たたきつけ','クラフトアタック'],f:['なげつけ'],h:['しゅうり'],r:{drAdj:'のなおしてあげる',drawOnDeath:'ののこしもの'},kana:['コツ','トンテン'],role:'しょくにん'},
  sound:{res:['healEnd','atk1','gaugeStart'],sp:['sanctuary','tsunami','raikou'],lean:'',a:['おんぱ','ビート'],b:['だいがっしょう','ハウリング'],f:['ひびくこえ'],h:['ララバイ','いやしのメロディ'],r:{healEnd:'のララバイ',atk1:'のおうえんか'},kana:['オト','ララ'],role:'うたいて'},
  home:{res:['healEnd','drAdj','regen'],sp:['sanctuary','drop'],lean:'hp',a:['とじこめ'],h:['くつろぎ','おかえり','ひとやすみ'],r:{healEnd:'のやすらぎ',drAdj:'のあまやどり'},kana:['ウチ','ホッコ'],role:'るすばん'},
  ball:{res:['atk1','haste'],sp:['raikou','gale'],lean:'atk',a:['スマッシュ','バウンド'],f:['シュート','ホームラン'],r:{atk1:'のファインプレー',haste:'のスタートダッシュ'},kana:['タマ','ポン'],role:'せんしゅ'},
  water:{res:['regen','healEnd','drAdj'],sp:['tsunami','drop','flare'],lean:'',el:'water',a:['みずしぶき','アクアショット'],b:['だいつなみ','ざぶーん'],h:['みずのめぐみ'],r:{regen:'のうるおい',healEnd:'のめぐみのあめ'},kana:['ミズ','シズク'],role:'みずのせい'},
  stone:{res:['drSelf','regen'],sp:['starfall','tsunami'],lean:'hp',a:['いわおとし','ずつき'],b:['ロックブラスト','じしん'],r:{drSelf:'のいわのからだ'},kana:['イワ','ゴツ'],role:'いわのたみ'},
  wear:{res:['drSelf','drawOnDeath'],sp:['drop','flare'],lean:'hp',a:['まきつき','ぬのビンタ'],h:['つくろいもの'],r:{drSelf:'のあつぎ',drawOnDeath:'のポケットのなか'},kana:['ヌノ','ポケ'],role:'つくもがみ'},
  body:{res:['atk1','drawOnDeath'],sp:['flare','raikou'],lean:'',a:['パンチ','キック','チョップ'],f:['ぶちかまし'],r:{atk1:'のきあいだめ'},kana:['テ','ゲンコ'],role:'からだのせい'},
  treasure:{res:['drawOnDeath','gaugeOnDeath'],sp:['raikou','aurora'],lean:'',a:['きんかなげ'],f:['ゴールドラッシュ'],h:['たからのひかり'],r:{drawOnDeath:'のおたから',gaugeOnDeath:'のへそくり'},kana:['キン','タカラ'],role:'たからもの'},
  magic:{res:['gaugeStart','gaugeOnDeath','drawOnDeath'],sp:['starfall','aurora','reap'],lean:'',a:['まほうだん','ミラクル'],k:['きえちゃえ'],h:['ふしぎなひかり'],r:{gaugeStart:'のまほうのちから',gaugeOnDeath:'のふしぎなかけら'},kana:['フシギ','マホ'],role:'まほうつかい'},
  cute:{res:['lifeOnDeath','drawOnDeath','lifeStart'],sp:['bloom','drop'],lean:'hp',a:['うるうるビーム','ぷにぷにアタック'],h:['あまえる','もふもふ'],r:{lifeOnDeath:'のなみだ',drawOnDeath:'のおみやげ',lifeStart:'のえがお'},kana:['モフ','チビ'],role:'なかよし'},
  royal:{res:['atk1','gaugeStart'],sp:['starfall','gigabolt'],lean:'',a:['おうのさばき','ロイヤルブロー'],b:['ひれふせ'],r:{atk1:'のいげん',gaugeStart:'のおうめい'},kana:['オウ','キング'],role:'おうさま'},
  time:{res:['gaugeStart','drawOnDeath','haste'],sp:['raikou','aurora'],lean:'',a:['タイムアタック'],f:['いまだ！'],h:['まきもどし'],r:{gaugeStart:'のときをきざむ',haste:'のさきどり'},kana:['トキ','チク'],role:'ときのばんにん'},
  bug:{res:['haste','burnOnDeath','drawOnDeath'],sp:['gale','flare'],lean:'atk',a:['むしのしらせ','はさみうち'],b:['むれでおそう'],r:{haste:'のすばしっこさ'},kana:['ムシ'],role:'むし'}
};
// 物ごとの性質（先に書いたものほど大事）
const RK_OBJTAG={};
[['claw','cat dog lion tiger bear raccoon monkey squirrel kangaroo crocodile dragon owl zebra'],
 ['horn','rhinoceros cow'],
 ['poison','snake scorpion spider bee mosquito skull mushroom'],
 ['spike','hedgehog cactus pineapple zigzag saw fork nail'],
 ['shell','sea_turtle snail crab lobster castle helmet anvil The_Great_Wall_of_China jail fence umbrella'],
 ['heavy','elephant whale rhinoceros camel mountain bulldozer tractor aircraft_carrier truck pickup_truck dumbbell pumpkin cow pig panda bear'],
 ['fly','bird owl parrot duck swan flamingo butterfly bee bat airplane helicopter blimp hot_air_balloon parachute angel feather space_shuttle satellite flying_saucer'],
 ['swim','fish shark whale dolphin octopus crab lobster sea_turtle mermaid penguin duck swan frog crocodile submarine canoe sailboat speedboat cruise_ship snorkel'],
 ['fire','sun campfire candle dragon lighter matches fireplace stove oven lantern race_car'],
 ['ice','snowman snowflake penguin ice_cream popsicle cooler snowboard'],
 ['elec','lightning light_bulb power_outlet computer laptop cell_phone television satellite_dish loudspeaker radio stereo headphones calculator'],
 ['wind','tornado hurricane fan ceiling_fan windmill cloud feather parachute'],
 ['plant','tree flower leaf bush grass cactus mushroom house_plant palm_tree garden broccoli peas string_bean asparagus carrot onion potato'],
 ['heal','heart angel hospital syringe bandage stethoscope pillow bed teddy-bear hot_tub bathtub'],
 ['sweet','cake birthday_cake donut cookie ice_cream popsicle lollipop strawberry watermelon grapes apple banana pear blueberry blackberry pretzel'],
 ['food','steak hamburger hot_dog pizza sandwich bread potato peanut tomato onion carrot frying_pan'],
 ['shine','star moon sun light_bulb lantern lighthouse chandelier diamond crown rainbow flashlight streetlight candle floor_lamp necklace bracelet'],
 ['dark','skull skeleton bat spider jail camouflage scorpion nothing cross'],
 ['night','moon owl bat'],
 ['tech','computer laptop cell_phone television radio microwave toaster satellite satellite_dish microscope drill calculator remote_control keyboard camera washing_machine dishwasher spreadsheet power_outlet'],
 ['speed','car race_car motorbike train bus school_bus truck police_car ambulance firetruck van bicycle skateboard rollerskates speedboat airplane rabbit horse kangaroo space_shuttle roller_coaster snowboard'],
 ['blade','sword axe knife saw scissors'],
 ['shoot','rifle cannon arrow boomerang'],
 ['tool','hammer pliers screwdriver drill shovel rake broom paintbrush crayon pencil marker eraser stapler paper_clip compass'],
 ['sound','guitar drums trumpet trombone saxophone clarinet violin cello piano harp bell microphone megaphone loudspeaker headphones music stereo'],
 ['home','house couch bed chair table pillow teapot mug cup dresser bookshelf door bathtub sink toilet barn church tent'],
 ['ball','soccer_ball basketball baseball tennis_racquet baseball_bat golf_club hockey_stick hockey_puck'],
 ['water','rain pond river ocean pool waterslide garden_hose fire_hydrant sink bucket beach'],
 ['stone','mountain anvil hourglass castle The_Great_Wall_of_China stairs skyscraper'],
 ['wear','hat sock shoe t-shirt sweater jacket pants shorts underwear belt bowtie flip_flops backpack purse eyeglasses'],
 ['body','hand foot arm leg finger knee elbow toe head face nose mouth ear eye tooth brain beard moustache goatee person_walking person_sitting yoga male female'],
 ['treasure','money diamond crown purse present key passport necklace'],
 ['magic','infinity The_Mona_Lisa mermaid angel dragon flying_saucer rainbow key nothing camouflage squiggle check'],
 ['cute','rabbit mouse panda teddy-bear sheep duck penguin smiley_face squirrel pig cat dog'],
 ['royal','crown lion castle The_Eiffel_Tower'],
 ['time','clock alarm_clock wristwatch hourglass calendar'],
 ['bug','ant bee butterfly mosquito spider snail scorpion']
].forEach(([t,s])=>s.split(' ').forEach(k=>(RK_OBJTAG[k]=RK_OBJTAG[k]||[]).push(t)));
// なかまのふだんの性質（物に性質がないとき）
const RK_GTAG={A:['claw'],B:['fly'],S:['swim'],I:['bug'],F:['food'],P:['plant'],N:['shine'],K:['home'],V:['speed'],T:['tool'],W:['blade'],H:['home'],C:['wear'],Y:['body'],M:['sound'],G:['ball'],E:['tech'],L:['magic'],X:['magic'],J:['body'],Z:['magic']};
// 属性の音（名前の頭）と、分類で使う属性のことば
const RK_ELKANA={fire:['ヒ','ホムラ','メラ'],water:['ミズ','シズク','アワ'],thunder:['ピカ','ビリ','イナ'],forest:['ハッパ','モリ','コケ'],light:['キラ','ヒカリ','ホシ'],dark:['ヤミ','カゲ','ヨル']};
const RK_ELWORD={fire:'ほのお',water:'みず',thunder:'いかずち',forest:'もり',light:'ひかり',dark:'やみ'};
const RK_TAGEL={fire:'fire',ice:'water',swim:'water',water:'water',elec:'thunder',plant:'forest',shine:'light',heal:'light',dark:'dark',night:'dark'};
// 何の絵か分からないときの「オリジナルのいきもの」：形のようすで決める
const RK_ORIG={
  blob:{m:['プル','モチ','ポヨ','フワ','モフ'],tags:['cute','heal'],kind:'ぷるぷるのいきもの',adj:'ぷるぷるの',seal:'heart'},
  spiky:{m:['ギザ','トゲ','チク','ガリ'],tags:['spike','claw'],kind:'とげとげのけもの',adj:'とげとげの',seal:'fang'},
  golem:{m:['ゴツ','ガチ','ドス','ズン'],tags:['stone','heavy'],kind:'かたまりのきょじん',adj:'ごつごつの',seal:'shield'},
  wisp:{m:['ヒュン','シュバ','スイ','ヒラ'],tags:['wind','fly'],kind:'かぜのせいれい',adj:'ひゅるりの',seal:'star'},
  gear:{m:['カラクリ','ギア','カチ','ピコ'],tags:['tech','magic'],kind:'ふしぎなからくり',adj:'からくりの',seal:'star'},
  prism:{m:['キラ','パレ','ニジ','ピカ'],tags:['shine','magic'],kind:'いろどりのようせい',adj:'きらきらの',seal:'rainbow'},
  mask:{m:['ミラ','ツイ','カガ'],tags:['magic','dark'],kind:'かがみのせいれい',adj:'かがみうつしの',seal:'star'},
  doodle:{m:['ラク','グル','クネ','ポテ'],tags:['magic','cute'],kind:'らくがきのこびと',adj:'らくがきの',seal:'heart'}
};
// オリジナルの体つきごとの、とくべつな能力・技の名前（その能力・技になったとき半分くらいの確率で使う）と、ふやした擬態語
Object.assign(RK_ORIG.blob,{m2:['プニ','ムニ','ポテ','プク','モチ'],sig:{res:{regen:'ぷるぷるさいせい',drSelf:'ぷにぷにボディ',lifeOnDeath:'ぷるんとおまもり',healEnd:'ぷるぷるいやし'},sp:{drop:'ぷるんとヒール',bloom:'もちもちタイム',sanctuary:'ぷるぷるのわ',flare:'ぷにぷにアタック'}}});
Object.assign(RK_ORIG.spiky,{m2:['ジャギ','トガ','ギギ','ザク','バリ'],sig:{res:{thorn:'とげのよろい',pierce:'つきささるトゲ',atk1:'さかだつトゲ',burnOnDeath:'はじけるトゲ'},sp:{flare:'トゲミサイル',gale:'トゲトゲラッシュ',starfall:'ギザギザスラッシュ'}}});
Object.assign(RK_ORIG.golem,{m2:['ガン','ゴロ','ドシ','ガツ','ズシ'],sig:{res:{drSelf:'いわはだ',drAdj:'ごつごつのかべ',regen:'つちのちから'},sp:{tsunami:'じひびき',starfall:'ゴーレムパンチ',gigabolt:'だいちわれ'}}});
Object.assign(RK_ORIG.wisp,{m2:['ヒュル','フワ','ソヨ','スー','シュン'],sig:{res:{haste:'かぜのあし',gaugeStart:'かぜよみ',atk1:'おいかぜ'},sp:{gale:'つむじかぜ',raikou:'かぜのいちげき',tsunami:'おおかぜ'}}});
Object.assign(RK_ORIG.gear,{m2:['ガシャ','キリ','ギギ','カタ','ピピ'],sig:{res:{gaugeStart:'はぐるまチャージ',drAdj:'からくりシールド',atk1:'オーバーギア'},sp:{raikou:'からくりビーム',gigabolt:'フルギアバースト',flare:'ネジとばし'}}});
Object.assign(RK_ORIG.prism,{m2:['キラリ','パステル','ピカ','チラ','ルリ'],sig:{res:{lifeStart:'にじいろのひかり',gaugeStart:'きらめきチャージ',healEnd:'いろどりのいやし'},sp:{aurora:'プリズムのきせき',starfall:'にじいろのや',raikou:'まぶしいひかり'}}});
Object.assign(RK_ORIG.mask,{m2:['ミラ','ウツ','カゲ','ツイ','シン'],sig:{res:{gaugeOnDeath:'うつしみ',drawOnDeath:'もうひとりのじぶん',gaugeStart:'かがみうつし'},sp:{reap:'かがみのさばき',starfall:'はねかえし',aurora:'かがみのいのり'}}});
Object.assign(RK_ORIG.doodle,{m2:['ラク','グル','クネ','ポテ','ニョロ'],sig:{res:{drawOnDeath:'らくがきのつづき',gaugeOnDeath:'けしごむのあと',lifeOnDeath:'かきなおし'},sp:{flare:'クレヨンビーム',drop:'かきたし',raikou:'いたずらがき'}}});
// オリジナルの体のなかま（いちばんありそうななかま）の音
const RK_GMORPH={A:['ガル','ジュウ','ビス'],B:['ピィ','バド','ツバ'],S:['ギョ','フィン','ヒレ'],I:['ムシ','バグ','ハネ'],F:['モグ','パク'],P:['ハッパ','ツル','メブ'],N:['レイ','ルン','ソラ'],K:['ガン','トウ','ヤネ'],
  V:['ブン','ロボ'],T:['ギア','コツ'],W:['ヤイ','ジン'],H:['ウチ','ホコ'],C:['ヌノ','ポケ'],Y:['テテ','メメ'],M:['ララ','ポロ'],G:['ポン','タマ'],E:['メカ','ロボ','ピコ'],L:['カク','マル'],X:['フシ','ナゾ'],J:['ジン','コビ'],Z:['シル','マーク']};
// インクの色の性質と音
const RK_COLTAG={'赤':['fire'],'橙':['fire','sweet'],'黄':['elec','shine'],'黄緑':['plant','cute'],'緑':['plant'],'水色':['water','ice'],'青':['water'],'紫':['dark','magic'],'茶':['stone'],'桃':['cute','heal'],'肌':['cute','body'],'灰':['stone','tech'],'黒':[]};
const RK_COLM={'赤':['アカ','ベニ'],'橙':['ダイダイ','オレン'],'黄':['キイ','レモ'],'黄緑':['ワカバ','ライム'],'緑':['ミド','ワカ'],'水色':['ソラ','ミズイ'],'青':['アオ','ルリ'],'紫':['ムラ','スミレ'],'茶':['チャ','クリ'],'桃':['モモ','ピン'],'肌':['ハダ','ミルク'],'灰':['ハイ','ギン'],'黒':['クロ','スミ']};
// 音を組み立てるときの音のなかま（まるい・するどい・はやい・おもい・ひかる・くらい）
const RK_SYL={round:['モ','ポ','プ','ム','ル','フ','ボ','ノ','ロ','ヌ'],sharp:['キ','ト','チ','ギ','ザ','ガ','ジ','ツ','ケ'],fast:['シュ','ス','ヒュ','セ','ソ','フィ'],heavy:['ド','ゴ','ガ','バ','ズ','グ'],
  shine:['キラ','リ','ミ','ル','ピ','ラ'],dark:['ク','ノ','ヴァ','ゾ','ネ','ヤ']};
/* ---- プロフィール（キャラの説明文）の材料 ---- */
const RK_PLACE={fire:['かざんのふもと','たきびのそば','あついさばく'],water:['みずうみのほとり','うみのそこ','あめのまち'],thunder:['くものうえ','かみなりやま','でんせんのうえ'],
  forest:['ふかいもり','はらっぱ','こけのどうくつ'],light:['ほしぞらのした','そらのしろ','ひだまりのおか'],dark:['よるのまち','ふかいどうくつ','つきのうら']};
const RK_TAGLINE={claw:['するどいツメで えものを ねらう。','おこると けが さかだつ。'],horn:['じまんの ツノで なんでも つきやぶる。'],poison:['からだに どくを もっているので ちゅうい。'],
  spike:['トゲトゲの からだで みを まもる。'],shell:['こわいときは からに とじこもる。'],heavy:['あるくと じめんが ゆれるほど おもい。'],fly:['かぜに のって どこまでも とんでいく。'],
  swim:['およぐのが だいすき。'],fire:['からだが いつも ぽかぽか あたたかい。'],ice:['いきを はくと あたりが こおりつく。'],elec:['からだに でんきを ためている。'],
  wind:['かぜが ふくと げんきに なる。'],plant:['おひさまを あびて おおきく なる。'],heal:['けがを した なかまを ほうっておけない。'],sweet:['あまい かおりで なかまを あつめる。'],
  food:['いつも おなかを すかせている。'],shine:['くらい ところを あかるく てらす。'],dark:['くらやみに まぎれて うごく。'],night:['よるに なると めを さます。'],
  tech:['だれが つくったのか わからない ふしぎな しかけ。'],speed:['だれよりも はやく はしる。'],blade:['いちど ぬけば なんでも きりさく。'],shoot:['ねらった えものは にがさない。'],
  tool:['こまった ことが あると すぐ なおしてくれる。'],sound:['うたを うたうと みんなが あつまる。'],home:['いっしょに いると ほっとする。'],ball:['うごくものを みると とびつく。'],
  water:['かわいた ところに あめを ふらせる。'],stone:['なんねんも うごかずに いることが ある。'],wear:['だいじに されてきた ものに こころが やどった。'],body:['きたえた からだが じまん。'],
  treasure:['ぴかぴかの ものを あつめるのが すき。'],magic:['ふしぎな ちからを ひめている。'],cute:['なでられると うれしそうに する。'],royal:['いつも いばっているが なかまおもい。'],
  time:['じかんには とても きびしい。'],bug:['なかまと むれで くらしている。']};
const RK_RESLINE={atk1:'なかまが そばに いると ちからが わいてくる。',drAdj:'となりの なかまを かばって たたかう。',drSelf:'かたい からだで こうげきを はねかえす。',gaugeStart:'たたかいの まえに ちからを ためる。',
  pierce:'その こうげきは あいてを つらぬく。',drawOnDeath:'たおれても なかまに おくりものを のこす。',gaugeOnDeath:'たおれても その おもいは きえない。',burnOnDeath:'たおれる ときに さいごの いちげきを はなつ。',
  lifeOnDeath:'たおれると なかまを げんきに する。',healEnd:'たたかいの あとは みんなの きずを いやす。',regen:'けがを しても すぐに なおる。',thorn:'さわると チクリと する。',
  lifeStart:'そばに いるだけで げんきが でる。',haste:'でてきた とたんに とびかかる。'};
const RK_ORIGLINE={blob:'ぷるぷるの からだは どんな かたちにも かわる。',spiky:'からだじゅう トゲだらけで だれも ちかよれない。',golem:'いわのような からだは びくとも しない。',
  wisp:'かぜの なかから うまれた と いわれている。',gear:'からだの なかで はぐるまが カタカタ まわっている。',prism:'ひかりを あびると にじいろに かがやく。',
  mask:'かがみに うつった すがたが ほんものかも しれない。',doodle:'だれかの らくがきから うまれた。'};
/* おまかせでかいた絵のなかみ → 性質・分類・名前の音・印・説明（naming.js rkWho） */
const RK_META={
  sword:{tags:['blade','body'],role:'けんし',m:['ブレイ','ヤイバ','ケン','ジン'],g:'J',seal:'fang',line:'けんの うでを みがく たびの けんし。'},
  knight:{tags:['blade','shell','royal'],role:'きし',m:['ナイ','タテ','ガード','ラン'],g:'J',seal:'shield',line:'みんなを まもる ほこりたかい きし。'},
  mage:{tags:['magic','shine'],role:'まほうつかい',m:['マホ','ルーン','ステラ','メル'],g:'J',seal:'star',line:'ふしぎな じゅもんを となえる まほうつかい。'},
  archer:{tags:['shoot','speed'],role:'ゆみつかい',m:['ユミ','アロ','ハヤテ','シュウ'],g:'J',seal:'fang',line:'とおくの まとも はずさない ゆみの めいじん。'},
  dragon:{tags:['claw','fly','royal'],role:'ドラゴン',m:['ドラ','リュウ','ガル','ヴァル'],g:'X',seal:'fang',line:'おおきな つばさで そらを かける。'},
  babydragon:{tags:['claw','cute','fly'],role:'こどもドラゴン',m:['ドラ','チビ','リュウ','ピィ'],g:'X',seal:'heart',line:'いつか おおきな ドラゴンに なる ゆめを みている。'},
  bird:{tags:['fly'],role:'とり',m:['ピヨ','バサ','チュン'],g:'B',seal:'star'},fish:{tags:['swim'],role:'さかな',m:['ピチ','ギョ','スイ'],g:'S',seal:'shield'},
  quad:{tags:['claw','speed'],role:'けもの',m:['ガル','ワフ','タタ'],g:'A',seal:'fang'},worm:{tags:['bug'],role:'いもむし',m:['ニョロ','モゾ','クネ'],g:'I',seal:'heart'},
  jelly:{tags:['swim','poison'],role:'クラゲ',m:['フワ','クラ','ユラ'],g:'S',seal:'heart'},cloud:{tags:['wind','water'],role:'くものせい',m:['モク','フワ','ソラ'],g:'N',seal:'star'},
  bug:{tags:['bug','fly'],role:'むし',m:['ブン','ムシ','ハネ'],g:'I',seal:'fang'},robot:{tags:['tech'],role:'ロボット',m:['メカ','ロボ','ギア','ピコ'],g:'E',seal:'shield',line:'だれかが つくった こころやさしい ロボット。'},
  pot:{tags:['plant'],role:'はなのせい',m:['ハナ','ポワ','メブ'],g:'P',seal:'heart'},ghost:{tags:['dark','magic'],role:'おばけ',m:['ヒュー','オバ','フワ'],g:'X',seal:'star'},
  golem:{tags:['stone','heavy'],role:'ゴーレム',m:['ゴツ','ガン','ドシ'],g:'K',seal:'shield'},chibi:{tags:[],role:'',m:['プル','モチ','ポコ'],g:'A',seal:''},headbody:{tags:[],role:'',m:['ポコ','ムム','ポテ'],g:'J',seal:''},
  // 2026-11-23 追加の体のつくり
  octopus:{tags:['swim','magic'],role:'タコ',m:['ニュル','スミ','ハッポ'],g:'S',seal:'heart'},mushroom:{tags:['plant','poison'],role:'キノコ',m:['ポコ','カサ','ホウ'],g:'P',seal:'heart'},
  crab:{tags:['claw','shell'],role:'カニ',m:['チョキ','ハサ','ガニ'],g:'S',seal:'shield'},bat:{tags:['fly','dark'],role:'コウモリ',m:['パタ','バサ','ヨル'],g:'X',seal:'star'},
  snail:{tags:['shell','water'],role:'カタツムリ',m:['ノロ','カラ','マイ'],g:'I',seal:'shield'},slime:{tags:['poison','cute'],role:'スライム',m:['プル','ドロ','ネバ'],g:'X',seal:'heart'},
  tree:{tags:['plant','heavy'],role:'きのせい',m:['モリ','ミキ','コダ'],g:'P',seal:'shield'},
  turtle:{tags:['shell','swim'],role:'カメ',m:['ノッシ','コウラ','カメ'],g:'S',seal:'shield'},shark:{tags:['claw','swim'],role:'サメ',m:['ガブ','ジョー','フカ'],g:'S',seal:'fang'},
  phoenix:{tags:['fire','fly','royal'],role:'ひのとり',m:['フェニ','ホムラ','ヒノ'],g:'X',seal:'star'},snake:{tags:['poison','speed'],role:'ヘビ',m:['シュル','ニョロ','ジャ'],g:'X',seal:'fang'},
  spider:{tags:['poison','bug'],role:'クモ',m:['ハチア','イト','クモ'],g:'I',seal:'fang'}
};
// テーマの性質と、体つき（とくべつな能力の表）の対応
const RK_THEMETAG={fire:'fire',water:'water',plant:'plant',elec:'elec',ghost:'dark',fluffy:'cute',dragon:'claw',rock:'stone',star:'shine'};
const RK_THEMEROLE={fire:'ほのおのせい',water:'みずのせい',plant:'もりのたみ',elec:'いかずちのせい',ghost:'おばけ',fluffy:'もふもふ',dragon:'こりゅう',rock:'いわのたみ',star:'ほしのせい'};
const RK_META_ORIG={golem:'golem',ghost:'mask',cloud:'wisp',jelly:'blob',robot:'gear',chibi:'blob',headbody:'doodle'};
// なかまの呼び名（似たものがあるときの分類）
const RK_GKIND={A:'けもの',B:'とり',S:'うみのいきもの',I:'むし',F:'たべもののせい',P:'くさきのせい',N:'しぜんのせい',K:'たてもののせい',V:'のりもののせい',T:'どうぐのせい',W:'ぶきのせい',
  H:'いえのせい',C:'つくもがみ',Y:'からだのせい',M:'おんがくのせい',G:'スポーツのせい',E:'からくり',L:'かたちのせい',X:'ふしぎないきもの',J:'こびと',Z:'しるしのせい'};
