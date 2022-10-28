import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Keypair, Transaction } from '@solana/web3.js'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import BackLink from '../components/BackLink'
import Loading from '../components/Loading'
import {
  MakeTransactionInputData,
  MakeTransactionOutputData,
} from './api/makeTransactions'
import { FindReferenceError, findReference } from '@solana/pay'

export default function Checkout() {
  const router = useRouter()
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const searchParams = new URLSearchParams()
  for (const [key, val] of Object.entries(router.query)) {
    if (val) {
      if (Array.isArray(val)) {
        for (const v of val) {
          searchParams.append(key, v)
        }
      } else {
        searchParams.append(key, val)
      }
    }
  }

  const ref = useMemo(() => Keypair.generate().publicKey, [])

  searchParams.append('reference', ref.toString())

  const getTransaction = async () => {
    if (!publicKey) return
    const body: MakeTransactionInputData = {
      account: publicKey.toString(),
    }

    const res = await fetch(
      `/api/makeTransactions?${searchParams.toString()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    const json = (await res.json()) as MakeTransactionOutputData

    if (res.status !== 200) {
      return console.error(json)
    }

    const transaction = Transaction.from(
      Buffer.from(json.transaction, 'base64')
    )
    setTransaction(transaction)
    setMessage(json.message)
    console.log(transaction)
  }

  useEffect(() => {
    getTransaction()
  }, [publicKey])

  async function trySendTransaction() {
    if (!transaction) {
      return
    }
    try {
      await sendTransaction(transaction, connection)
    } catch (e) {
      console.error(e)
    }
  }

  // Send the transaction once it's fetched
  useEffect(() => {
    trySendTransaction()
  }, [transaction])

  // Check every 0.5s if the transaction is completed
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Check if there is any transaction for the referenc
        const signatureInfo = await findReference(connection, ref)
        router.push('/confirmed')
      } catch (e) {
        if (e instanceof FindReferenceError) {
          // No transaction found yet, ignore this error
          return
        }
        console.error('Unknown error', e)
      }
    }, 500)
    return () => {
      clearInterval(interval)
    }
  }, [])

  // render code unchanged

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center gap-8">
        <div>
          <BackLink href="/">Cancel</BackLink>
        </div>

        <WalletMultiButton />

        <p>You need to connect your wallet to make transactions</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div>
        <BackLink href="/">Cancel</BackLink>
      </div>

      <WalletMultiButton />

      {message ? (
        <p>{message} Please approve the transaction using your wallet</p>
      ) : (
        <p>
          Creating transaction... <Loading />
        </p>
      )}
    </div>
  )
}
