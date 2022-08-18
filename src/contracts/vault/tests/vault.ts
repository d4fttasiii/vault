import * as anchor from "@project-serum/anchor";
import { Program, BN } from "@project-serum/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { Vault } from "../target/types/vault";
import { expect } from "chai";

describe("vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const bob = new Keypair();
  const program = anchor.workspace.Vault as Program<Vault>;

  const getProfilePda = async (address: PublicKey): Promise<PublicKey> => {
    const [pda, _] = await PublicKey.findProgramAddress(
      [anchor.utils.bytes.utf8.encode("vault-profile"), address.toBuffer()],
      program.programId
    );

    return pda;
  };

  const getProfileDocumentPda = async (
    address: PublicKey,
    docCount: number
  ): Promise<PublicKey> => {
    const [pda, _] = await PublicKey.findProgramAddress(
      [
        anchor.utils.bytes.utf8.encode("vault-document"),
        address.toBuffer(),
        anchor.utils.bytes.utf8.encode(docCount.toString()),
      ],
      program.programId
    );

    return pda;
  };

  const getProfileDocumentSharePda = async (
    documentPda: PublicKey,
    invitee: PublicKey
  ): Promise<PublicKey> => {
    const [pda, _] = await PublicKey.findProgramAddress(
      [
        documentPda.toBuffer(),
        anchor.utils.bytes.utf8.encode("vault-document-share"),
        invitee.toBuffer(),
      ],
      program.programId
    );

    return pda;
  };

  it("Creates Profile", async () => {
    const profilPda = await getProfilePda(provider.wallet.publicKey);

    await program.methods
      .createProfile()
      .accounts({
        profile: provider.wallet.publicKey,
        profileData: profilPda,
      })
      .rpc();

    expect(
      (await program.account.profileData.fetch(profilPda)).profile
    ).to.be.eql(provider.wallet.publicKey);

    expect(
      (
        await program.account.profileData.fetch(profilPda)
      ).documentCount.toNumber()
    ).to.be.eql(0);
  });

  it("Upload 5 Documents", async () => {
    const profilPda = await getProfilePda(provider.wallet.publicKey);

    for (let i = 0; i < 5; i++) {
      const profileDocumentPda = await getProfileDocumentPda(
        provider.wallet.publicKey,
        i
      );
      await program.methods
        .createProfileDocument(`asd-${i}.jpg`)
        .accounts({
          profile: provider.wallet.publicKey,
          profileData: profilPda,
          document: profileDocumentPda,
        })
        .rpc();
    }

    expect(
      (
        await program.account.profileData.fetch(profilPda)
      ).documentCount.toNumber()
    ).to.be.eql(5);
  });

  it("Sharing the 3rd document", async () => {
    const profileDocumentPda = await getProfileDocumentPda(
      provider.wallet.publicKey,
      2
    );
    const profileDocumentSharePda = await getProfileDocumentSharePda(
      profileDocumentPda,
      bob.publicKey
    );

    await program.methods
      .createProfileDocumentShare(new BN(2), bob.publicKey, new BN(8))
      .accounts({
        profile: provider.wallet.publicKey,
        document: profileDocumentPda,
        documentShare: profileDocumentSharePda,
      })
      .rpc();

    expect(
      (
        await program.account.documentShareData.fetch(profileDocumentSharePda)
      ).documentIndex.toNumber()
    ).to.be.eql(2);

    expect(
      (
        await program.account.documentShareData.fetch(profileDocumentSharePda)
      ).invitee.toBase58()
    ).to.be.eql(bob.publicKey.toBase58());
  });

  it("Revoke 3rd document share", async () => {
    const profileDocumentPda = await getProfileDocumentPda(
      provider.wallet.publicKey,
      2
    );
    const profileDocumentSharePda = await getProfileDocumentSharePda(
      profileDocumentPda,
      bob.publicKey
    );

    await program.methods
      .toggleProfileDocumentShare(new BN(2), bob.publicKey)
      .accounts({
        profile: provider.wallet.publicKey,
        document: profileDocumentPda,
        documentShare: profileDocumentSharePda,
      })
      .rpc();

    expect(
      (await program.account.documentShareData.fetch(profileDocumentSharePda))
        .isActive
    ).to.be.eql(false);
  });

  it("Delete 4th document", async () => {
    const profilPda = await getProfilePda(provider.wallet.publicKey);
    const profileDocumentPda = await getProfileDocumentPda(
      provider.wallet.publicKey,
      3
    );

    await program.methods
      .deleteProfileDocument(new BN(3))
      .accounts({
        profile: provider.wallet.publicKey,
        document: profileDocumentPda,
        profileData: profilPda,
      })
      .rpc();

    expect(
      (await program.account.documentData.fetch(profileDocumentPda)).deleted
    ).to.be.eql(true);
  });
});
