'use strict';
// 名前＝属性の字＋形の字＋見えたもの（カタカナ）　例：炎牙ネコ・蒼玉サカナ・星彩ホシ
const RK_ELC={fire:'炎焔紅',water:'蒼潮雫',thunder:'雷轟紫',forest:'翠森葉',light:'星月煌',dark:'影闇朧'};
const RK_TRC={spiky:'牙刃棘',round:'玉丸毬',solid:'岩鎧鋼',big:'王帝嶽',fast:'風閃疾',detail:'紋織彫',colorful:'彩華虹',sym:'鏡双',plain:'心灯音'};
const RK_TRW={spiky:'トゲトゲ',round:'マルマル',solid:'カタマリ',big:'デカブツ',fast:'ハヤテ',detail:'モヨウ',colorful:'イロドリ',sym:'フタゴ',plain:'ラクガキ'};
const RK_SHORT={flashlight:'ライト',lollipop:'キャンディ',cruise_ship:'フネ',pickup_truck:'トラック',rollerskates:'スケート',bowtie:'ネクタイ',coffee_cup:'カップ',
  birthday_cake:'ケーキ',skyscraper:'ビル',waterslide:'スライダー',alarm_clock:'トケイ',flip_flops:'サンダル',spreadsheet:'ヒョウ',roller_coaster:'コースター',
  tennis_racquet:'ラケット',soccer_ball:'ボール',basketball:'ボール',baseball:'ボール',The_Eiffel_Tower:'エッフェル',ice_cream:'アイス',popsicle:'アイス',
  cooler:'クーラー',dishwasher:'アライキ',floor_lamp:'ライト',speedboat:'ボート',hockey_stick:'スティック',The_Great_Wall_of_China:'ジョウヘキ',
  pineapple:'パイン',blueberry:'ベリー',blackberry:'ベリー',asparagus:'アスパラ',suitcase:'カバン',octagon:'ハッカク',hexagon:'ロッカク',submarine:'サブマリン',
  snorkel:'ゴーグル',school_bus:'バス',chandelier:'ランプ',stethoscope:'ドクター',binoculars:'ソウガン',clarinet:'フエ',teapot:'ポット',hot_dog:'ドッグ',
  laptop:'パソコン',smiley_face:'ニコニコ',wine_glass:'グラス',bandage:'ホウタイ',squiggle:'ウネウネ',trumpet:'ラッパ',trombone:'ラッパ',golf_club:'ゴルフ',
  parachute:'ラッカサン',string_bean:'インゲン',syringe:'チュウシャ',diving_board:'トビダイ',broccoli:'ブロッコリ',sandwich:'サンド',hamburger:'バーガー',
  bulldozer:'ドーザー',mailbox:'ポスト',peas:'マメ',microwave:'レンジ',fire_hydrant:'ショウカセン',helicopter:'ヘリ',ambulance:'サイレン',diamond:'ダイヤ',firetruck:'ショウボウ',
  hockey_puck:'パック',wine_bottle:'ビン',foot:'アシ',palm_tree:'ヤシ',bottlecap:'フタ',ceiling_fan:'センプウキ',stop_sign:'トマレ',snowflake:'ケッショウ',
  animal_migration:'ダイイドウ','teddy-bear':'ヌイグルミ',satellite:'エイセイ',space_shuttle:'シャトル',snowboard:'スノボ'};
const RK_SEALTR={fang:'spiky',shield:'round',star:'detail',heart:'plain',rainbow:'colorful'};
// 横文字の材料：物の英語名・属性の言葉・形の言葉（うしろにつける）・コストでつく頭
const RK_EN={};('flashlight:ライト mushroom:マッシュ pond:ポンド strawberry:ベリー sun:サン cow:カウ ear:イヤー bush:ブッシュ watermelon:メロン apple:アップル '+
 'baseball:ボール feather:フェザー shoe:シューズ leaf:リーフ crown:クラウン ocean:オーシャン horse:ホース mountain:マウンテン mosquito:モスキート hospital:ホスピタル '+
 'saw:ソー castle:キャッスル angel:エンジェル underwear:パンツ traffic_light:シグナル cruise_ship:クルーザー face:フェイス hockey_stick:スティック campfire:ファイア '+
 'cloud:クラウド paint_can:ペイント hockey_puck:パック house_plant:プランツ sleeping_bag:シュラフ snowman:スノーマン arm:アーム fan:ファン leg:レッグ '+
 'washing_machine:ウォッシャー toothbrush:ブラシ tree:ツリー bear:ベアー rake:レーキ knee:ニー grapes:グレープ paintbrush:ブラシ nose:ノーズ square:スクエア '+
 'wristwatch:ウォッチ bridge:ブリッジ octagon:オクタゴン submarine:サブマリン ladder:ラダー wine_bottle:ボトル bracelet:ブレス broom:ブルーム finger:フィンガー '+
 'fish:フィッシュ line:ライン snake:スネーク stitches:ステッチ shorts:ショーツ bowtie:タイ tooth:トゥース snail:スネイル foot:フット crab:クラブ train:トレイン '+
 'sock:ソックス map:マップ beard:ビアード frog:フロッグ bathtub:バス rain:レイン moon:ムーン bee:ビー lighthouse:ビーコン jail:ジェイル stethoscope:ドクター '+
 'binoculars:スコープ purse:ポーチ birthday_cake:ケーキ palm_tree:パーム aircraft_carrier:キャリアー eraser:イレイザー skyscraper:タワー bicycle:サイクル '+
 'sink:シンク circle:サークル tornado:トルネード bird:バード key:キー bottlecap:キャップ The_Great_Wall_of_China:ウォール smiley_face:スマイル eyeglasses:レンズ '+
 'ceiling_fan:ファン carrot:キャロット garden:ガーデン postcard:カード beach:ビーチ car:カー alarm_clock:アラーム dog:ドッグ flower:フラワー bandage:テープ '+
 'butterfly:バタフライ swan:スワン owl:アウル squiggle:ウェーブ elephant:エレファント rabbit:ラビット sheep:シープ onion:オニオン church:チャーチ spreadsheet:シート '+
 'pear:ペアー clock:クロック monkey:モンキー rainbow:レインボー pencil:ペンシル string_bean:ビーンズ star:スター cat:キャット syringe:シリンジ eye:アイ mouse:マウス '+
 'The_Eiffel_Tower:エッフェル airplane:プレーン stop_sign:ストップ diving_board:ダイブ light_bulb:バルブ hammer:ハンマー basket:バスケット envelope:レター hat:ハット '+
 'book:ブック lightning:サンダー drums:ドラム snowflake:スノウ toothpaste:ペースト chair:チェア picture_frame:フレーム lipstick:ルージュ brain:ブレイン triangle:デルタ '+
 'cannon:キャノン camouflage:カモフラ scissors:シザーズ elbow:エルボー umbrella:アンブレラ windmill:ミル table:テーブル hexagon:ヘキサ potato:ポテト anvil:アンビル '+
 'sword:ソード axe:アックス river:リバー house:ハウス pillow:ピロー stairs:ステア fireplace:ストーブ mailbox:ポスト barn:バーン hot_tub:スパ teddy-bear:テディ '+
 'dishwasher:ウォッシャー peas:ピース hot_air_balloon:バルーン microwave:レンジ wheel:ホイール fire_hydrant:ハイドラ van:バン candle:キャンドル ambulance:サイレン '+
 'fence:フェンス grass:グラス mermaid:マーメイド toe:トゥ nail:ネイル telephone:テレフォン hand:ハンド streetlight:ランプ firetruck:レスキュー '+
 'person_walking:ウォーカー person_sitting:シッター head:ヘッド skeleton:スケルトン bowl:ボウル microscope:スコープ pumpkin:パンプキン rooster:ルースター '+
 'satellite:サテライト space_shuttle:シャトル wheelbarrow:カート snowboard:スノボ bookshelf:シェルフ comb:コーム infinity:エターナル cross:クロス '+
 'male:ボーイ female:ガール money:マネー music:メロディ nothing:ゼロ arrow:アロー').split(' ').forEach(s=>{const[k,v]=s.split(':');RK_EN[k]=v});
const RK_ELE={fire:['フレア','ブレイズ','イグニス','バーン'],water:['アクア','マリン','ミスト','タイド'],thunder:['ボルト','スパーク','ゼウス','プラズマ'],
  forest:['リーフ','ガイア','グリン','モス'],light:['ルミナ','ノヴァ','シャイン','ステラ'],dark:['シャドウ','ノクス','ダーク','ネクロ']};
const RK_TRS={spiky:['ファング','エッジ','ザウルス','スパイク'],round:['ボール','ポン','ロン','マル'],solid:['ゴーレム','タンク','アーマー'],big:['キング','タイタン','ドン'],
  fast:['ウイング','ジェット','ダッシュ'],detail:['アーツ','クラフト','ルーン'],colorful:['プリズム','カラー','ミラージュ'],sym:['ツイン','ミラー'],plain:['ドン','ゴン','マル','キッド']};
const RK_HEAD={big:['ギガ','メガ','ハイパー','グランド'],small:['プチ','ミニ','ベビー','チビ']};
const RK_EL2={fire:['紅蓮','灼熱','業火'],water:['蒼海','潮騒','氷雨'],thunder:['迅雷','雷鳴','紫電'],forest:['深緑','木霊','若葉'],light:['星詠','月光','白銀'],dark:['宵闇','冥府','黒曜']};
const RK_OLDPRE=/^(紅蓮|潮騒|雷鳴|深緑|星明かり|宵闇|火|水|雷|森|光|闇)の/;
