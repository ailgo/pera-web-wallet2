import {ReactComponent as AccountDefaultIcon} from "../../../../../../../core/ui/icons/account-default.svg";
import {ReactComponent as ApplicationCallIcon} from "../../../../../../../core/ui/icons/application-call.svg";
import {ReactComponent as CreateIcon} from "../../../../../../../core/ui/icons/create.svg";
import {ReactComponent as DeleteIcon} from "../../../../../../../core/ui/icons/delete.svg";
import {ReactComponent as ModifyIcon} from "../../../../../../../core/ui/icons/modify.svg";

import "./_transaction-sign-single-view-wallets.scss";

import algosdk, {OnApplicationComplete} from "algosdk";
import classNames from "classnames";

import {useAppContext} from "../../../../../../../core/app/AppContext";
import {
  trimAccountAddress,
  trimAccountName
} from "../../../../../../../account/util/accountUtils";
import {
  checkIfTransactionApplicationCall,
  checkIfTransactionAssetConfig,
  isCreateApplicationTransaction,
  isTransactionCreateAssetConfig,
  isTransactionDeleteAssetConfig,
  isTransactionUpdateAssetConfig
} from "../../../../../../utils/transactionUtils";
import {useTransactionSignFlowContext} from "../../../../../../context/TransactionSignFlowContext";

function TransactionSignSingleViewWallets() {
  const {
    state: {accounts}
  } = useAppContext();
  const {
    formitoState: {activeTransactionIndex, txns}
  } = useTransactionSignFlowContext();
  const activeTransaction = txns[activeTransactionIndex];
  const accountsArray = Object.values(accounts);
  const isApplicationCall = checkIfTransactionApplicationCall(activeTransaction.txn);
  const isAssetConfig = checkIfTransactionAssetConfig(activeTransaction.txn);
  const toAddress = activeTransaction.txn.to
    ? algosdk.encodeAddress(activeTransaction.txn.to.publicKey)
    : "";
  const fromAddress = activeTransaction.txn.from
    ? algosdk.encodeAddress(activeTransaction.txn.from.publicKey)
    : "";
  const fromAccount = accountsArray.find((account) => account.address === fromAddress);
  const toAccount = accountsArray.find((account) => account.address === toAddress);

  return (
    <div className={"transaction-sign-single-view-wallets"}>
      <div
        className={classNames("transaction-sign-single-view-wallets__wallet", {
          "transaction-sign-single-view-wallets__wallet--from-unknown-wallet":
            !fromAccount
        })}>
        <AccountDefaultIcon width={32} height={32} />

        <div>
          <p className={"typography--body"}>
            {`${
              fromAccount?.name
                ? trimAccountName(fromAccount.name)
                : trimAccountAddress(fromAddress)
            }${fromAccount ? " (You)" : ""}`}
          </p>

          {fromAccount?.name && (
            <p className={"typography--secondary-body text-color--gray-light"}>
              {trimAccountAddress(fromAddress)}
            </p>
          )}
        </div>
      </div>

      <div className={"transaction-sign-single-view-wallets__to"}>
        <p
          className={
            "text--uppercase typography--tagline text-color--gray-lightest transaction-sign-single-view-wallets__to__text"
          }>
          {"To"}
        </p>
      </div>

      <div
        className={classNames(
          "typography--body transaction-sign-single-view-wallets__wallet",
          {
            "transaction-sign-single-view-wallets__wallet--to-unknown-wallet": !toAccount
          }
        )}>
        {renderFromIcon()}

        {renderFromDescription()}
      </div>
    </div>
  );

  function renderFromIcon() {
    if (isApplicationCall) {
      if (isCreateApplicationTransaction(activeTransaction.txn)) {
        return <CreateIcon width={32} height={32} />;
      }

      switch (activeTransaction.txn.appOnComplete) {
        case OnApplicationComplete.UpdateApplicationOC:
          return <ModifyIcon width={32} height={32} />;
        case OnApplicationComplete.DeleteApplicationOC:
          return <DeleteIcon width={32} height={32} />;
        default:
          return <ApplicationCallIcon width={32} height={32} />;
      }
    }

    if (isAssetConfig) {
      if (isTransactionCreateAssetConfig(activeTransaction.txn)) {
        return <CreateIcon width={32} height={32} />;
      }

      if (isTransactionUpdateAssetConfig(activeTransaction.txn)) {
        return <ModifyIcon width={32} height={32} />;
      }

      if (isTransactionDeleteAssetConfig(activeTransaction.txn)) {
        return <DeleteIcon width={32} height={32} />;
      }
    }

    return <AccountDefaultIcon width={32} height={32} />;
  }

  function renderFromDescription() {
    if (isApplicationCall) {
      if (isCreateApplicationTransaction(activeTransaction.txn)) {
        return "Create Application";
      }

      return `Application #${activeTransaction.txn.appIndex}`;
    }

    if (isAssetConfig) {
      if (isTransactionCreateAssetConfig(activeTransaction.txn)) {
        return activeTransaction.txn.assetName
          ? `Create "${activeTransaction.txn.assetName}" Asset`
          : "Create Asset";
      }

      return `Asset Configuration - ${activeTransaction.txn.assetIndex}`;
    }

    return (
      <div>
        <p className={"typography--body"}>
          {`${
            toAccount?.name
              ? trimAccountName(toAccount.name)
              : trimAccountAddress(toAddress)
          }${toAccount ? " (You)" : ""}`}
        </p>

        {toAccount?.name && (
          <p className={"typography--secondary-body text-color--gray-light"}>
            {trimAccountAddress(toAddress)}
          </p>
        )}
      </div>
    );
  }
}

export default TransactionSignSingleViewWallets;
