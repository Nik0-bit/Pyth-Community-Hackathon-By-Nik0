export interface PythPrice {
  symbol: string;
  pair: string;
  price: number;
  confidence: number;
  change24h: number;
  publishTime: number;
  feedId: string;
  category: 'crypto' | 'stock' | 'fx' | 'metal';
}

export const PYTH_PRICE_IDS: Record<string, string> = {
  // ── TOP CRYPTO ──────────────────────────────────────────────────────────────
  BTC:    '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH:    '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  SOL:    '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  XRP:    '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
  BNB:    '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  ADA:    '0x2a01deaec9e51a579277b34b122399984d0bbf57e2458a7e42fecd2829867a0d',
  DOGE:   '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  AVAX:   '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  DOT:    '0xca3eed9b267293f6595901c734c7525ce8ef49adafe8284606ceb307afa2ca5b',
  SHIB:   '0xf0d57deca57b3da2fe63a493f4c25925fdfd8edf834b20f93e1f84dbd1504d4a',
  LINK:   '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  UNI:    '0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501',
  LTC:    '0x6e3f3fa8253588df9326580180233eb791e03b443a3ba7a1d892e73874e19a54',
  BCH:    '0x3dd2b63686a450ec7290df3a1e0b583c0481f651351edfa7636f39aed55cf8a3',
  ATOM:   '0xb00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819',
  FIL:    '0x150ac9b959aee0051e4091f0ef5216d941f590e1c5e7f91cf7635b5c11628c0e',
  ICP:    '0xc9907d786c5821547777780a1e4f89484f3417cb14dd244f2b0a34ea7a554d67',
  APT:    '0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5',
  ARB:    '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
  OP:     '0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf',
  NEAR:   '0xc415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750',
  INJ:    '0x7a5bc1d2b56ad029048cd63964b3ad2776eadf812edc1a43a31406cb54bff592',
  SUI:    '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  SEI:    '0x53614f1cb0c031d4af66c04cb9c756234adad0e1cee85303795091499a4084eb',
  TIA:    '0x09f7c1d7dfbb7df2b8fe3d3d87ee94a2259d212da4f30c1f0540d066dfa44723',
  JTO:    '0xb43660a5f790c69354b0729a5ef9d50d68f1df92107540210b9cccba1f947cc2',
  PYTH:   '0x0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff',
  JUP:    '0x0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be830996',
  WIF:    '0x4ca4beeca86f0d164160323817a4e42b10010a724c2217c6ee41b54cd4cc61fc',
  BONK:   '0x72b021217ca3fe68922a19aaf990109cb9d84e9ad004b4d2025ad6f529314419',
  PEPE:   '0xd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4',
  FLOKI:  '0x6b1381ce7e874dc5410b197ac8348162c0dd6c0d4c9cd6322672d6c2b1d58293',
  RENDER: '0x3d4a2bd9535be6ce8059d75eadeba507b043257321aa544717c56fa19b49e35d',
  TON:    '0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026',
  HBAR:   '0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd',
  TRX:    '0x67aed5a24fdad045475e7195c98a98aea119c763f272d4523f5bac93a4f33c2b',
  ETC:    '0x7f5cc8d963fc5b3d2ae41fe5685ada89fd4f14b435f8050f28c7fd409f40c2d8',
  XLM:    '0xb7a8eba68a997cd0210c2e1e4ee811ad2d174b3611c22d9ebf16f4cb7e9ba850',
  ALGO:   '0xfa17ceaf30d19ba51112fdcc750cc83454776f47fb0112e4af07f15f4bb1ebc0',
  SAND:   '0xcb7a1d45139117f8d3da0a4b67264579aa905e3b124efede272634f094e1e9d1',
  MANA:   '0x1dfffdcbc958d732750f53ff7f06d24bb01364b3f62abea511a390c74b8d16a5',
  GRT:    '0x4d1f8dae0d96236fb98e8f47471a366ec3b1732b47041781934ca3a9bb2f35e7',
  LDO:    '0xc63e2a7f37a04e5e614c07238bedb25dcc38927fba8fe890597a593c0b2fa4ad',
  MKR:    '0x9375299e31c0deb9c6bc378e6329aab44cb48ec655552a70d4b9050346a1ab7f',
  AAVE:   '0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445',
  SNX:    '0x39d020f60982ed892abbcd4a06a276a9f9b7bfbce003204c110b6e488f502da3',
  SUSHI:  '0x26e4f737fde0263a9eea10ae63ac36dcedab2aaf629261a994e1eeb6ee0afe53',
  '1INCH': '0x63f341689d98a12ef60a5cff1d7f85c70a9e17bf1575f0e7c0b2512d48b1c8b3',
  DYDX:   '0x6489800bb8974169adfe35937bf6736507097d13c190d760c557108c7e93a81b',
  GMX:    '0xb962539d0fcb272a494d65ea56f94851c2bcf8823935da05bd628916e2e9edbf',
  CRV:    '0xa19d04ac696c7a6616d291c7e5d1377cc8be437c327b75adb5dc1bad745fcae8',
  COMP:   '0x4a8e42861cabc5ecb50996f92e7cfa2bce3fd0a2423b0c44c9b423fb2bd25478',
  YFI:    '0x425f4b198ab2504936886c1e93511bb6720fbcf2045a4f3c0723bb213846022f',
  VET:    '0x1722176f738aa1aafea170f8b27724042c5ac6d8cb9cf8ae02d692b0927e0681',
  MASK:   '0xb97d9aa5c9ea258252456963c3a9547d53e4848cb66ce342a3155520741a28d4',
  BAT:    '0x8e860fb74e60e5736b455d82f60b3728049c348e94961add5f961b02fdee2535',
  STORJ:  '0x21776e4ed1e763d580071fd6394d71e582672c788f64f4a279e60ec1497e27c4',
  QTUM:   '0xb17096e28039ccc2b84e330c27e29706cf6779c3c6f2853527f516509f9819f6',
  WAVES:  '0x70dddcb074263ce201ea9a1be5b3537e59ed5b9060d309e12d61762cfe59fb7e',
  HNT:    '0x649fdd7ec08e8e2a20f425729854e90293dcbe2376abc47197a14da6ff339756',
  ANKR:   '0x89a58e1cab821118133d6831f5018fba5b354afb78b2d18f575b3cbf69a4f652',
  ICX:    '0x843bb7ab4846e3f233f34082ef188a94f79517f66c224bd85b2b5cb34d10d745',
  ZEC:    '0xbe9b59d178f0d6a97ab4c343bff2aa69caa1eaae3e9048a65788c529b125bb24',
  DASH:   '0x6147ae2020c6ff95f7c961f79660020f36fa72cea06452a866d5788cbedf61f3',
  ENJ:    '0x5cc254b7cb9532df39952aee2a6d5497b42ec2d2330c7b76147f695138dbd9f3',
  AXS:    '0xb7e3904c08ddd9c0c10c6d207d390fd19e87eb6aab96304f571ed94caebdefa0',
  GALA:   '0x0781209c28fda797616212b7f94d77af3a01f3e94a5d421760aef020cf2bcb51',
  FET:    '0x7da003ada32eabbac855af3d22fcf0fe692cc589f0cfd5ced63cf0bdcc742efe',
  LUNC:   '0x4456d442a152fd1f972b18459263ef467d3c29fb9d667e30c463b086691fbc79',
  XTZ:    '0x0affd4b8ad136a21d79bc82450a325ee12ff55a235abc242666e423b8bcffd03',
  IOTA:   '0xc7b72e5d860034288c9335d4d325da4272fe50c92ab72249d58f6cbba30e4c44',
  ZIL:    '0x609722f3b6dc10fee07907fe86781d55eb9121cd0705b480954c00695d78f0cb',
  USDC:   '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',

  // ── US STOCKS ───────────────────────────────────────────────────────────────
  AAPL:   '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
  TSLA:   '0x16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
  NVDA:   '0xb1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593',
  MSFT:   '0xd0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1',
  GOOGL:  '0x5a48c03e9b9cb337801073ed9d166817473697efff0d138874e0f6a33d6d5aa6',
  AMZN:   '0xb5d0e0fa58a1f8b81498ae670ce93c872d14434b72c364885d4fa1b257cbb07a',
  META:   '0x78a3e3b8e676a8f73c439f5d749737034b139bbbe899ba5775216fba596607fe',
  NFLX:   '0x8376cfd7ca8bcdf372ced05307b24dced1f15b1afafdeff715664598f15a3dd2',
  AMD:    '0x3622e381dbca2efd1859253763b1adc63f7f9abb8e76da1aa8e638a57ccde93e',
  INTC:   '0xc1751e085ee292b8b3b9dd122a135614485a201c35dfc653553f0e28c1baf3ff',
  COIN:   '0xfee33f2a978bf32dd6b662b65ba8083c6773b494f8401194ec1870c640860245',
  PYPL:   '0x773c3b11f6be58e8151966a9f5832696d8cd08884ccc43ac8965a7ebea911533',
  UBER:   '0xc04665f62a0eabf427a834bb5da5f27773ef7422e462d40c7468ef3e4d39d8f1',
  SNAP:   '0xa23dd397c4f7a2187d00c1973e58ff6e8a681658b1105d1bd42a8fccbbd068f7',
  BA:     '0x8419416ba640c8bbbcf2d464561ed7dd860db1e38e51cec9baf1e34c4be839ae',
  GS:     '0x9c68c0c6999765cf6e27adf75ed551b34403126d3b0d5b686a2addb147ed4554',
  JPM:    '0x7f4f157e57bfcccd934c566df536f34933e74338fe241a5425ce561acdab164e',
  BAC:    '0x21debc1718a4b76ff74dadf801c261d76c46afaafb74d9645b65e00b80f5ee3e',
  C:      '0xe7e7aac1ac0524cd3666fae4ecafae5e1fee880c11f3a7b4b7ea61bd6e434a63',
  MS:     '0x97b55381ff94c6c0a22f3e0c8cdc2186a3561bf3dfe3cfaebf4786c9318b770f',
  V:      '0xc719eb7bab9b2bc060167f1d1680eb34a29c490919072513b545b9785b73ee90',
  MA:     '0x639db3fe6951d2465bd722768242e68eb0285f279cb4fa97f677ee8f80f1f1c0',
  WMT:    '0x327ae981719058e6fb44e132fb4adbf1bd5978b43db0661bfdaefd9bea0c82dc',
  TGT:    '0x13537ceb2df5af0b8cdf8032561b0a71430b51297375bbfdc6ed209df1da0d65',
  COST:   '0x163f6a6406d65305e8e27965b9081ac79b0cf9529f0fcdc14fe37e65e3b6b5cb',
  HD:     '0xb3a83dbe70b62241b0f916212e097465a1b31085fa30da3342dd35468ca17ca5',
  LOW:    '0xab31ec9dbcacacfb26e5ea6c249d69f5ae8b9c691aac6ccc5919b6107efa1c3a',
  NKE:    '0x67649450b4ca4bfff97cbaf96d2fd9e40f6db148cb65999140154415e4378e14',
  SBUX:   '0x86cd9abb315081b136afc72829058cf3aaf1100d4650acb2edb6a8e39f03ef75',
  MCD:    '0xd3178156b7c0f6ce10d6da7d347952a672467b51708baaf1a57ffe1fb005824a',
  DIS:    '0x703e36203020ae6761e6298975764e266fb869210db9b35dd4e4225fa68217d0',
  CMCSA:  '0x1bd6720eea4df323c076c9bbc1e98e8f5fe4bd16584e56468c5fb6b1a6072725',
  T:      '0x63e9f918ab91507c3574cca011da4dccda30cf54d46124d03b70279142ff81f3',
  PFE:    '0x0704ad7547b3dfee329266ee53276349d48e4587cb08264a2818288f356efd1d',
  JNJ:    '0x12848738d5db3aef52f51d78d98fc8b8b8450ffb19fb3aeeb67d38f8c147ff63',
  AMGN:   '0x10946973bfcc936b423d52ee2c5a538d96427626fe6d1a7dae14b1c401d1e794',
  MRNA:   '0x4083b0b1471123cf4d3e8edee7890940cafad866f06cadae638c23e555a1f4fc',
  CVX:    '0xf464e36fd4ef2f1c3dc30801a9ab470dcdaaa0af14dd3cf6ae17a7fca9e051c5',
  XOM:    '0x4a1a12070192e8db9a89ac235bb032342a390dde39389b4ee1ba8e41e7eae5d8',
  CSCO:   '0x3f4b77dd904e849f70e1e812b7811de57202b49bc47c56391275c0f45f2ec481',
  IBM:    '0xcfd44471407f4da89d469242546bb56f5c626d5bef9bd8b9327783065b43c3ef',
  ORCL:   '0xe47ff732eaeb6b4163902bdee61572659ddf326511917b1423bae93fcdf3153c',
  SAP:    '0x0ee2e3f1c7689e1abf957009f747228a30b47678c8e5844cb033cbcf790fa20b',
  CRM:    '0xfeff234600320f4d6bb5a01d02570a9725c1e424977f2b823f7231e6857bdae8',
  NOW:    '0x69d2eebcc3c62889f1c0105ff347f296eb435cba8d2e4705a486fd47a8fe1a1b',
  PLTR:   '0x11a70634863ddffb71f2b11f2cff29f73f3db8f6d0b78c49f2b5f4ad36e885f0',
  CRWD:   '0xbaed936d3c6c2e34104e92c6b015b97ce96adc5ab4f04230c1270e1162e7a270',
  DDOG:   '0x5c49964b5e5420d84e445a2f5e9e3965cf3a82a275d83f8efc30cdeeaf2d062f',
  NET:    '0xd3a9e76862950b2f21a7037fd64df913794b14d0e2938a9d383b0b7387ca0081',
  ZS:     '0x16164a6568478238fc3102145ad51d973598850073ace86ceda7c89cb7b74598',
  SNOW:   '0x14291d2651ecf1f9105729bdc59553c1ce73fb3d6c931dd98a9d2adddc37e00f',
  SHOP:   '0xc9034e8c405ba92888887bc76962b619d0f8e8bf3e12aba972af0cf64e814d5d',
  EBAY:   '0x6264a259e2cc90dfd3207f5831949eced2da6bf53965834c9160e4ceb9240947',
  BABA:   '0x72bc23b1d0afb1f8edef20b7fb60982298993161bc0fd749587d6f60cd1ee9a3',
  JD:     '0x4c45e26d5253283ab4736b4f4ba9d0e6517679f8425ef07722dacc4b6da90750',
  PDD:    '0xae69f62081eb15ae4f077397871a1cf29cacf75e7b1db740aed9074c1efd3fa4',
  NIO:    '0xc8916a12ca17ed0883e37a10c8962370fbd2878a35bb70f6902a0f52be73338c',
  XPEV:   '0x9898aa7f08a1ed39d930640595a03f4aaf638c1875763fb94eab70cc0c6d3ed5',
  ABNB:   '0xccab508da0999d36e1ac429391d67b3ac5abf1900978ea1a56dab6b1b932168e',
  RBLX:   '0xd62134a195739141d0649991f11fe0f9cd9eb83fd890bc3ba41dfdd18c1a49f4',
  HOOD:   '0x306736a4035846ba15a3496eed57225b64cc19230a50d14f3ed20fd7219b7849',
  SOFI:   '0x72fae0e0683c186f5ce9444afac9909cf5d60b499f4f9569dd75442f19c625c8',
  AFRM:   '0x137b11f6e570f46d5cbcf1ebe05ba1bbc677d419ba6eefb5e7f0786c11adae06',
  LYFT:   '0x76432b180fc368bfc48be955bee5e73906ed230e73b1eea94d31e2317e5b221c',
  ASML:   '0x1a6e324589a0e355919fb1c0389edc3fdf4c46034626bd82aad4e47714cfa94f',

  // ── FOREX ───────────────────────────────────────────────────────────────────
  EURUSD: '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
  GBPUSD: '0x84c2dde9633d93d1bcad84e7dc41c9d56578b7ec52fabedc1f335d673df0a7c1',
  AUDUSD: '0x67a6f93030420c1c9e3fe37c1ab6b77966af82f995944a9fefce357a22854a80',
  NZDUSD: '0x92eea8ba1b00078cdc2ef6f64f091f262e8c7d0576ee4677572f314ebfafa4c7',
  USDJPY: '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52',
  USDCHF: '0x0b1e3297e69f162877b577b0d6a47a0d63b2392bc8499e6540da4187a63e28f8',
  USDCAD: '0x3112b03a41c910ed446852aacf67118cb1bec67b2cd0b9a214c58cc0eaa2ecca',
  USDSGD: '0x396a969a9c1480fa15ed50bc59149e2c0075a72fe8f458ed941ddec48bdb4918',
  USDHKD: '0x19d75fde7fee50fe67753fdc825e583594eb2f51ae84e114a5246c4ab23aff4c',
  USDCNH: '0xeef52e09c878ad41f6a81803e3640fe04dceea727de894edd4ea117e2e332e66',
  USDKRW: '0xe539120487c29b4defdf9a53d337316ea022a2688978a468f9efd847201be7e3',
  USDTRY: '0x032a2eba1c2635bf973e95fb62b2c0705c1be2603b9572cc8d5edeaf8744e058',
  USDBRL: '0xd2db4dbf1aea74e0f666b0e8f73b9580d407f5e5cf931940b06dc633d7a95906',
  USDMXN: '0xe13b1c1ffb32f34e1be9545583f01ef385fde7f42ee66049d30570dc866b77ca',
  USDINR: '0x0ac0f9a2886fc2dd708bc66cc2cea359052ce89d324f45d95fadbc6c4fcf1809',
  USDZAR: '0x389d889017db82bf42141f23b61b8de938a4e2d156e36312175bebf797f493f1',
  USDSEK: '0x8ccb376aa871517e807358d4e3cf0bc7fe4950474dbe6c9ffc21ef64e43fc676',
  USDNOK: '0x235ddea9f40e9af5814dbcc83a418b98e3ee8df1e34e1ae4d45cf5de596023a3',
  USDPLN: '0x07cd9b7bb0575a74a7eec1ea357fb01aff3a5d9a1b567394dbdf87ddb5bf777b',

  // ── METALS ──────────────────────────────────────────────────────────────────
  XAUUSD: '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
  XAGUSD: '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e',
};

const SYMBOL_CATEGORY: Record<string, PythPrice['category']> = {
  // Crypto
  BTC: 'crypto', ETH: 'crypto', SOL: 'crypto', XRP: 'crypto', BNB: 'crypto',
  ADA: 'crypto', DOGE: 'crypto', AVAX: 'crypto', DOT: 'crypto', SHIB: 'crypto',
  LINK: 'crypto', UNI: 'crypto', LTC: 'crypto', BCH: 'crypto', ATOM: 'crypto',
  FIL: 'crypto', ICP: 'crypto', APT: 'crypto', ARB: 'crypto', OP: 'crypto',
  NEAR: 'crypto', INJ: 'crypto', SUI: 'crypto', SEI: 'crypto', TIA: 'crypto',
  JTO: 'crypto', PYTH: 'crypto', JUP: 'crypto', WIF: 'crypto', BONK: 'crypto',
  PEPE: 'crypto', FLOKI: 'crypto', RENDER: 'crypto', TON: 'crypto', HBAR: 'crypto',
  TRX: 'crypto', ETC: 'crypto', XLM: 'crypto', ALGO: 'crypto', SAND: 'crypto',
  MANA: 'crypto', GRT: 'crypto', LDO: 'crypto', MKR: 'crypto', AAVE: 'crypto',
  SNX: 'crypto', SUSHI: 'crypto', '1INCH': 'crypto', DYDX: 'crypto', GMX: 'crypto',
  CRV: 'crypto', COMP: 'crypto', YFI: 'crypto', VET: 'crypto', MASK: 'crypto',
  BAT: 'crypto', STORJ: 'crypto', QTUM: 'crypto', WAVES: 'crypto', HNT: 'crypto',
  ANKR: 'crypto', ICX: 'crypto', ZEC: 'crypto', DASH: 'crypto', ENJ: 'crypto',
  AXS: 'crypto', GALA: 'crypto', FET: 'crypto', LUNC: 'crypto', XTZ: 'crypto',
  IOTA: 'crypto', ZIL: 'crypto', USDC: 'crypto',
  // Stocks
  AAPL: 'stock', TSLA: 'stock', NVDA: 'stock', MSFT: 'stock', GOOGL: 'stock',
  AMZN: 'stock', META: 'stock', NFLX: 'stock', AMD: 'stock', INTC: 'stock',
  COIN: 'stock', PYPL: 'stock', UBER: 'stock', SNAP: 'stock', BA: 'stock',
  GS: 'stock', JPM: 'stock', BAC: 'stock', C: 'stock', MS: 'stock',
  V: 'stock', MA: 'stock', WMT: 'stock', TGT: 'stock', COST: 'stock',
  HD: 'stock', LOW: 'stock', NKE: 'stock', SBUX: 'stock', MCD: 'stock',
  DIS: 'stock', CMCSA: 'stock', T: 'stock', PFE: 'stock', JNJ: 'stock',
  AMGN: 'stock', MRNA: 'stock', CVX: 'stock', XOM: 'stock', CSCO: 'stock',
  IBM: 'stock', ORCL: 'stock', SAP: 'stock', CRM: 'stock', NOW: 'stock',
  PLTR: 'stock', CRWD: 'stock', DDOG: 'stock', NET: 'stock', ZS: 'stock',
  SNOW: 'stock', SHOP: 'stock', EBAY: 'stock', BABA: 'stock', JD: 'stock',
  PDD: 'stock', NIO: 'stock', XPEV: 'stock', ABNB: 'stock', RBLX: 'stock',
  HOOD: 'stock', SOFI: 'stock', AFRM: 'stock', LYFT: 'stock', ASML: 'stock',
  // FX
  EURUSD: 'fx', GBPUSD: 'fx', AUDUSD: 'fx', NZDUSD: 'fx',
  USDJPY: 'fx', USDCHF: 'fx', USDCAD: 'fx', USDSGD: 'fx',
  USDHKD: 'fx', USDCNH: 'fx', USDKRW: 'fx', USDTRY: 'fx',
  USDBRL: 'fx', USDMXN: 'fx', USDINR: 'fx', USDZAR: 'fx',
  USDSEK: 'fx', USDNOK: 'fx', USDPLN: 'fx',
  // Metals
  XAUUSD: 'metal', XAGUSD: 'metal',
};

const SYMBOL_PAIR: Record<string, string> = {
  EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', AUDUSD: 'AUD/USD', NZDUSD: 'NZD/USD',
  USDJPY: 'USD/JPY', USDCHF: 'USD/CHF', USDCAD: 'USD/CAD', USDSGD: 'USD/SGD',
  USDHKD: 'USD/HKD', USDCNH: 'USD/CNH', USDKRW: 'USD/KRW', USDTRY: 'USD/TRY',
  USDBRL: 'USD/BRL', USDMXN: 'USD/MXN', USDINR: 'USD/INR', USDZAR: 'USD/ZAR',
  USDSEK: 'USD/SEK', USDNOK: 'USD/NOK', USDPLN: 'USD/PLN',
  XAUUSD: 'XAU/USD', XAGUSD: 'XAG/USD',
};

const priceCache: Record<string, { data: PythPrice; ts: number }> = {};
const CACHE_TTL = 2500;

async function hermesHeaders(): Promise<Record<string, string>> {
  const h: Record<string, string> = {};
  if (process.env.PYTH_API_KEY) h['x-api-key'] = process.env.PYTH_API_KEY;
  return h;
}

export async function fetchPythPrices(symbols: string[], bypassCache = false): Promise<PythPrice[]> {
  const upper = symbols.map(s => s.toUpperCase());
  const toFetch = bypassCache
    ? upper.filter(s => PYTH_PRICE_IDS[s])
    : upper.filter(s => {
        const c = priceCache[s];
        return PYTH_PRICE_IDS[s] && (!c || Date.now() - c.ts > CACHE_TTL);
      });

  if (toFetch.length > 0) {
    // Batch in groups of 100 to stay within URL limits
    const BATCH = 100;
    for (let i = 0; i < toFetch.length; i += BATCH) {
      const chunk = toFetch.slice(i, i + BATCH);
      const ids = chunk.map(s => PYTH_PRICE_IDS[s]).filter(Boolean);
      if (ids.length === 0) continue;
      const url = `https://hermes.pyth.network/v2/updates/price/latest?${ids.map(id => `ids[]=${id}`).join('&')}`;
      try {
        const headers = await hermesHeaders();
        const res = await globalThis.fetch(url, { headers });
        if (!res.ok) throw new Error(`Hermes HTTP ${res.status}`);
        const data = await res.json() as any;
        const parsed: any[] = data.parsed || [];

        for (const item of parsed) {
          const feedId = '0x' + item.id;
          const sym = Object.entries(PYTH_PRICE_IDS).find(([, v]) => v === feedId)?.[0];
          if (!sym) continue;

          const expo = item.price.expo;
          const price = parseFloat(item.price.price) * Math.pow(10, expo);
          const conf = parseFloat(item.price.conf) * Math.pow(10, expo);
          const emaPrice = parseFloat(item.ema_price.price) * Math.pow(10, item.ema_price.expo);
          const change24h = price > 0 ? ((price - emaPrice) / emaPrice) * 100 : 0;

          priceCache[sym] = {
            ts: Date.now(),
            data: {
              symbol: sym,
              pair: SYMBOL_PAIR[sym] ?? `${sym}/USD`,
              price,
              confidence: conf,
              change24h: parseFloat(change24h.toFixed(2)),
              publishTime: item.price.publish_time,
              feedId,
              category: SYMBOL_CATEGORY[sym] ?? 'crypto',
            },
          };
        }
      } catch (err) {
        console.error('[Pyth] fetch error:', err);
      }
    }
  }

  return upper
    .map(s => priceCache[s]?.data)
    .filter((p): p is PythPrice => !!p);
}

export async function fetchSinglePrice(symbol: string): Promise<PythPrice | null> {
  const results = await fetchPythPrices([symbol.toUpperCase()]);
  return results[0] ?? null;
}

export function getAllSupportedSymbols(): string[] {
  return Object.keys(PYTH_PRICE_IDS);
}

export function getSymbolsByCategory(category: PythPrice['category']): string[] {
  return Object.keys(PYTH_PRICE_IDS).filter(s => SYMBOL_CATEGORY[s] === category);
}

export interface HistoricalPrice {
  symbol: string;
  pair: string;
  price: number;
  confidence: number;
  timestamp: number;
  feedId: string;
}

export async function fetchHistoricalPrice(symbol: string, timestamp: number): Promise<HistoricalPrice | null> {
  const sym = symbol.toUpperCase();
  const feedId = PYTH_PRICE_IDS[sym];
  if (!feedId) return null;

  const rawId = feedId.startsWith('0x') ? feedId.slice(2) : feedId;
  const url = `https://benchmarks.pyth.network/v1/updates/price/${timestamp}?ids=${rawId}`;

  try {
    const headers = await hermesHeaders();
    const res = await globalThis.fetch(url, { headers });
    if (!res.ok) throw new Error(`Benchmarks HTTP ${res.status}`);
    const data = await res.json() as any;
    const parsed: any[] = data.parsed || [];
    if (parsed.length === 0) return null;

    const item = parsed[0];
    const expo = item.price.expo;
    const price = parseFloat(item.price.price) * Math.pow(10, expo);
    const conf = parseFloat(item.price.conf) * Math.pow(10, expo);

    return {
      symbol: sym,
      pair: SYMBOL_PAIR[sym] ?? `${sym}/USD`,
      price,
      confidence: conf,
      timestamp: item.price.publish_time,
      feedId: '0x' + item.id,
    };
  } catch (err) {
    console.error('[Pyth Benchmarks] error:', err);
    return null;
  }
}
