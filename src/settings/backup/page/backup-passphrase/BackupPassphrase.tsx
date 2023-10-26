import "./_backup-passphrase.scss";

import {ReactComponent as KeyIcon} from "../../../../core/ui/icons/key.svg";
import {ReactComponent as InfoIcon} from "../../../../core/ui/icons/info.svg";

import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import classNames from "classnames";

import PassphraseList from "../../../../component/passphrase-list/PassphraseList";
import GoBackButton from "../../../../component/go-back-button/GoBackButton";
import Button from "../../../../component/button/Button";
import ROUTES from "../../../../core/route/routes";
import useLocationWithState from "../../../../core/util/hook/useLocationWithState";
import ClipboardButton from "../../../../component/clipboard/button/ClipboardButton";
import {useModalDispatchContext} from "../../../../component/modal/context/ModalContext";
import ConfirmationModal from "../../../../component/confirmation-modal/ConfirmationModal";
import webStorage, {STORED_KEYS} from "../../../../core/util/storage/web/webStorage";
import {
  encryptAlgorandSecureBackup,
  generateASBKeyPassphrase
} from "../../../../core/util/nacl/naclUtils";
import {encryptedWebStorageUtils} from "../../../../core/util/storage/web/webStorageUtils";
import {useAppContext} from "../../../../core/app/AppContext";
import {ARCStandardMobileSyncAccount} from "../../../../account/accountModels";

const BACKUP_PASSPHRASE_CONFIRMATION_MODAL_ID = "backup-passphrase-confirmation-id";
const BACKUP_RECREATE_KEY_CONFIRMATION_MODAL_ID = "backup-recreate-key-confirmation-id";

type LocationState = {
  deviceId: string;
  passphrase: string;
  selectedAccounts: ARCStandardMobileSyncAccount[];
};

function BackupPassphrase() {
  const navigate = useNavigate();
  const {
    state: {masterkey}
  } = useAppContext();
  const {
    passphrase = "",
    selectedAccounts = [],
    deviceId = ""
  } = useLocationWithState<LocationState>();
  const dispatchModalAction = useModalDispatchContext();
  const isFirstBackup = !webStorage.local.getItem(STORED_KEYS.IS_FIRST_BACKUP_TAKEN);

  useEffect(() => {
    if (!passphrase) {
      navigate(ROUTES.SETTINGS.ROUTE);
    }
  }, [passphrase, navigate]);

  return (
    <div className={"backup-passphrase"}>
      <GoBackButton text={"Store your 12-word key"} />

      <p className={"text-color--gray typography--body backup-passphrase__description"}>
        {
          "Your 12-word key is used to decrypt any Algorand Secure Backup file generated by you.\n\nStore your 12-word key securely. "
        }

        <a
          target={"_blank"}
          rel={"noopener noreferrer"}
          href={
            "https://support.perawallet.app/en/article/algorand-secure-backup-1m0zrg9/"
          }
          className={"typography--body backup-passphrase__description-link"}>
          {"Find out how"}
        </a>

        {" with Pera Learn."}
      </p>

      <PassphraseList
        customClassname={"backup-passphrase__passphrase-list"}
        passphrase={passphrase}
      />

      <div className={"backup-passphrase__cta-group"}>
        <ClipboardButton
          customClassName={classNames("backup-passphrase__copy-cta", {
            "backup-passphrase__copy-cta--small": !isFirstBackup
          })}
          buttonType={"light"}
          textToCopy={passphrase}
          copiedMessage={"Key copied as text"}>
          {"Copy Key"}
        </ClipboardButton>

        {!isFirstBackup && (
          <Button
            buttonType={"light"}
            customClassName={"backup-passphrase__change-key-cta typography--body"}
            onClick={handleOpenRecreateKeyModal}>
            <KeyIcon width={16} height={16} />

            {"Create New 12-Word Key"}
          </Button>
        )}
      </div>

      <Button
        customClassName={"backup-passphrase__next-cta"}
        onClick={handleCreateBackup}>
        {"Next"}
      </Button>
    </div>
  );

  function handleCreateBackup() {
    dispatchModalAction({
      type: "OPEN_MODAL",
      payload: {
        item: {
          id: BACKUP_PASSPHRASE_CONFIRMATION_MODAL_ID,
          modalContentLabel: "Store 12-word key confirmation",
          customClassName: "backup-passphrase-confirmation-modal",
          children: (
            <ConfirmationModal
              id={BACKUP_PASSPHRASE_CONFIRMATION_MODAL_ID}
              icon={<InfoIcon />}
              title={"Have you stored your key?"}
              subtitle={
                "Store your key somewhere secure, like a password manager. If you lose your key, you will lose access to your backup file forever."
              }
              confirmText={"Create backup file"}
              cancelText={"Show key again"}
              onConfirm={handleNavigate}
            />
          )
        }
      }
    });
  }

  function handleOpenRecreateKeyModal() {
    dispatchModalAction({
      type: "OPEN_MODAL",
      payload: {
        item: {
          id: BACKUP_RECREATE_KEY_CONFIRMATION_MODAL_ID,
          modalContentLabel: "Store 12-word key confirmation",
          customClassName: "backup-passphrase__create-new-key-modal",
          children: (
            <ConfirmationModal
              id={BACKUP_RECREATE_KEY_CONFIRMATION_MODAL_ID}
              icon={<KeyIcon />}
              title={"Create new key"}
              subtitle={
                "You are about to reset your Algorand Secure Backup Key. You will generate a new 12-word key which will be used to encrypt and decrypt all future ASB files created from this device.\n\n Your previous ASB files remain encrypted with your old 12-word key. Ensure this is stored securely before proceeding."
              }
              confirmText={"I understand, proceed"}
              onConfirm={handleRecreateKey}
            />
          )
        }
      }
    });
  }

  async function handleRecreateKey() {
    webStorage.local.removeItem(STORED_KEYS.BACKUP_PASSPHRASE);

    const newPassphrase = generateASBKeyPassphrase();

    await encryptedWebStorageUtils(masterkey!).set(
      STORED_KEYS.BACKUP_PASSPHRASE,
      newPassphrase
    );

    navigate(ROUTES.SETTINGS.BACKUP.PASSPHRASE.ROUTE, {
      state: {passphrase: newPassphrase}
    });
  }

  async function handleNavigate() {
    const cipher = await encryptAlgorandSecureBackup(
      {
        device_id: deviceId,
        provider_name: "Pera Wallet",
        accounts: selectedAccounts
      },
      passphrase
    );

    webStorage.local.setItem(STORED_KEYS.IS_FIRST_BACKUP_TAKEN, true);

    navigate(ROUTES.SETTINGS.BACKUP.FILE.FULL_PATH, {state: {cipher}});
  }
}

export default BackupPassphrase;