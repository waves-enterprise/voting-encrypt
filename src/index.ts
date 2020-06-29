import * as elliptic from 'elliptic';
import { createHash } from 'crypto';
import BN from 'bn.js';
import {
    Config, EncryptedBulletin, Point, RangeProof, RangeProofWithoutAB
} from './interfaces';

type BasePoint = elliptic.curve.base.BasePoint

export default class Encrypt {
    private readonly ec: elliptic.ec;

    private readonly base: BasePoint;

    private readonly pointAtInfinity: BasePoint;

    private readonly mainKey: BasePoint;

    constructor(
        private readonly cryptoParams: Config
    ) {
        this.ec = new elliptic.ec('secp256k1');
        const { mainKey, basePoint } = this.cryptoParams;
        this.base = this.createPoint(basePoint);
        this.mainKey = this.createPoint(mainKey);
        this.pointAtInfinity = this.base.add(this.base.neg());
    }

    private createPoint(point: Point): BasePoint {
        const x_hex = new BN(point[0]).toString(16).padStart(64, '0');
        const y_hex = new BN(point[1]).toString(16).padStart(64, '0');
        return this.ec.keyFromPublic(`04${x_hex}${y_hex}`, 'hex').getPublic();
    }

    private generatePrivateKey(): BN {
        return new BN(this.ec.genKeyPair().getPrivate().toString());
    }

    private generateRandomFromScalarField(): BN {
        return this.generatePrivateKey();
    }

    private generateRandomLessThan(n: BN): BN {
        const currentMaxNumber = new BN(2).pow(new BN(521));
        const randomNumber = this.generateRandomFromScalarField().umod(n);

        while (n > currentMaxNumber) {
            randomNumber.imul(this.generateRandomFromScalarField());
            currentMaxNumber.imul(currentMaxNumber);
        }

        return randomNumber.umod(n);
    }

    private hashPoints(points: BasePoint[]): BN {
        const hash = createHash('sha256');

        points.forEach((point: BasePoint) => {
            const [x, y] = this.asPoint(point);
            hash.update(`${x},${y},`);
        });

        return new BN(hash.digest('hex'), 16);
    }

    private asPoint(point: BasePoint): Point {
        return point.isInfinity()
            ? ['0', '0']
            : [point.getX().toString(), point.getY().toString()];
    }

    private calculateRangeProof(
        vote: number,
        A: BasePoint,
        B: BasePoint,
        r: BN,
        publicKey: BasePoint
    ): RangeProof {
        const { q, hashLength } = this.cryptoParams;

        const n: BN = new BN(2).pow(new BN(hashLength));

        let points: Point[] = [];
        let scalars: Array<string | BN> = [];

        if (vote === 0) {
            const c1 = this.generateRandomLessThan(n);

            const r1_ss = this.generateRandomFromScalarField();

            const B_s = B.add(this.base.neg());
            const A1_s = this.base.mul(r1_ss).add(A.mul(c1).neg());
            const B1_s = publicKey.mul(r1_ss).add(B_s.mul(c1).neg());

            const r0_s = this.generateRandomFromScalarField();

            const A0_s = this.base.mul(r0_s);
            const B0_s = publicKey.mul(r0_s);

            const c = this.hashPoints([publicKey, A, B, A0_s, B0_s, A1_s, B1_s]);
            const c0 = c.add(c1.neg()).umod(n);

            const r0_ss = r0_s.add(c0.mul(r)).umod(new BN(q));

            points = [A, B, A0_s, A1_s, B0_s, B1_s].map(this.asPoint);
            scalars = [c0, c1, r0_ss, r1_ss];
        } else if (vote === 1) {
            const c0 = this.generateRandomLessThan(n);

            const r0_ss = this.generateRandomFromScalarField();

            const B_s = B;
            const A0_s = this.base.mul(r0_ss).add(A.mul(c0).neg());
            const B0_s = publicKey.mul(r0_ss).add(B_s.mul(c0).neg());

            const r1_s = this.generateRandomFromScalarField();

            const A1_s = this.base.mul(r1_s);
            const B1_s = publicKey.mul(r1_s);

            const c = this.hashPoints([publicKey, A, B, A0_s, B0_s, A1_s, B1_s]);

            const c1 = c.add(c0.neg()).umod(n);

            const r1_ss = r1_s.add(c1.mul(r)).umod(new BN(q));

            points = [A, B, A0_s, A1_s, B0_s, B1_s].map(this.asPoint);
            scalars = [c0, c1, r0_ss, r1_ss];
        } else {
            points = Array(6).fill(this.pointAtInfinity);
            scalars = ['0', '0', '0', '0'];
        }
        return [...points, ...scalars.map(String)] as RangeProof;
    }

    public makeEncryptedBulletin(bulletin: number[]): EncryptedBulletin {
        const { q } = this.cryptoParams;
        let sumVote = 0;
        let sumR = this.pointAtInfinity;
        let sumC = this.pointAtInfinity;
        let sumr = new BN(0);

        const encryptedBulletin = bulletin.map((vote) => {
            sumVote += vote;
            const message = this.base.mul(new BN(vote));
            const r = this.generateRandomFromScalarField();
            const R = this.base.mul(r);
            const C = this.mainKey.mul(r).add(message);

            sumR = sumR.add(R);
            sumC = sumC.add(C);
            sumr = sumr.add(r).umod(new BN(q));
            return this.calculateRangeProof(vote, R, C, r, this.mainKey);
        });

        const sumRangeProof_withoutAB: RangeProofWithoutAB = this.calculateRangeProof(
            sumVote,
            sumR,
            sumC,
            sumr,
            this.mainKey
        ).slice(2) as RangeProofWithoutAB;

        return [encryptedBulletin, sumRangeProof_withoutAB];
    }
}
