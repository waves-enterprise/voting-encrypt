Usage example
```typescript
  import Encrypt from '@vostokplatform/voting-encrypt';  

  const basePoint = [
    '55066263022277343669578718895168534326250603453777594175500187360389116729240',
    '32670510020758816978083085130507043184471273380659243275938904335757337482424'
  ];

  const hashLength = '256';

  const q = '115792089237316195423570985008687907852837564279074904382605163141518161494337';

  const mainKey = [
    '32983111314637801088355561917310615566685144003604692326323842087626703683857',
    '38829655112450477183306932510150578359761887386953658486573992752257631567231'
  ];

  // Создание Encrypt
  const enc = new Encrypt({
    mainKey,
    basePoint,
    hashLength,
    q
  });

  // шифрование голоса  
  const encrypted = enc.makeEncryptedBulletin([0,1,0]);
```

Для шифровния нескольких гоосов
```typescript
const votes = [
    [1,0,0], // первый вариант ответа в вопросе
    [0,1,0], // второй вариант ответа в вопросе
    [1,0,0] // первый вариант ответа в вопросе
];
const encrypted = votes.map((vote) => enc.makeEncryptedBulletin(vote));
```
