let provider;
let signer;
let contract;

const contractAddress = "0x701B8b98a44AcFbaA8406F9d97003866280fF01d";  // 배포된 스마트 계약 주소
const contractABI = [
    {
        "inputs": [],
        "name": "approveClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "executePayment",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_insured",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "_contractDetails",
                "type": "string"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "claimApproved",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "contractDetails",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "insured",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "insurer",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// MetaMask 연결 함수
async function connectMetaMask() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // MetaMask 연결 요청
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            showAlert(`MetaMask 연결 성공: ${accounts[0]}`, "success");
            return accounts[0];
        } catch (error) {
            console.error("MetaMask 연결 오류:", error);
            showAlert("MetaMask 연결 중 오류가 발생했습니다.", "danger");
        }
    } else {
        showAlert("MetaMask가 설치되어 있지 않습니다.", "danger");
    }
    return null;
}

// 보험 청구 승인 함수 호출
async function approveClaim() {
    if (!contract) {
        alert('지갑을 먼저 연결해주세요.');
        return;
    }

    try {
        const tx = await contract.approveClaim();
        await tx.wait();
        console.log('Claim approved');
        alert('보험 청구가 승인되었습니다.');
    } catch (error) {
        console.error('Error approving claim:', error);
        alert('보험 청구 승인 중 오류가 발생했습니다.');
    }
}

// 보험금 지급 함수 호출
async function executePayment() {
    if (!contract) {
        alert('지갑을 먼저 연결해주세요.');
        return;
    }

    try {
        const tx = await contract.executePayment({ value: ethers.utils.parseEther("0.1") });
        await tx.wait();
        console.log('Payment executed');
        alert('보험금이 지급되었습니다.');
    } catch (error) {
        console.error('Error executing payment:', error);
        alert('보험금 지급 중 오류가 발생했습니다.');
    }
}

// 보험 계약서 생성 함수
async function generateInsuranceContract(customerData) {
    try {
        const response = await fetch('/generate-contract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customer_data: customerData })
        });

        if (!response.ok) {
            throw new Error('보험 계약서 생성 중 오류 발생');
        }

        const data = await response.json();
        return data.contract;
    } catch (error) {
        console.error("Error generating contract:", error);
        showAlert("보험 계약서 생성 중 오류가 발생했습니다.", "danger");
        return null;
    }
}

// 고객 정보를 블록체인에 기록하는 함수
async function recordCustomerDataOnBlockchain(customerData) {
    try {
        console.log("고객 정보 입력:", customerData);
        showAlert("고객 정보 입력 완료", "info");

        const contract = await generateInsuranceContract(customerData);
        if (contract) {
            document.getElementById('contractResult').innerText = contract;
            showAlert("블록체인에 기록 완료", "success");
            document.getElementById('claimButton').disabled = false;
        }
    } catch (error) {
        console.error("Error recording on blockchain:", error);
        showAlert("블록체인 기록 중 오류가 발생했습니다.", "danger");
    }
}

// 알림을 표시하는 함수
function showAlert(message, type) {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertPlaceholder.append(alert);
}

// 폼 제출 시 고객 정보 블록체인 기록 함수 호출
document.getElementById('customerForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const customerData = {
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        policyNumber: document.getElementById('policyNumber').value
    };
    recordCustomerDataOnBlockchain(customerData);
});

// 보험금 청구 버튼 클릭 시
document.getElementById('claimButton').addEventListener('click', () => {
    showAlert("보험금 청구 요청 중...", "info");
    document.getElementById('connectWallet').disabled = false;
});

// MetaMask 연결 버튼 클릭 시
document.getElementById('connectWallet').addEventListener('click', async () => {
    const account = await connectMetaMask();
    if (account) {
        document.getElementById('payFee').disabled = false;
    }
});

// 수수료 지불 버튼 클릭 시
document.getElementById('payFee').addEventListener('click', async () => {
    const account = await connectMetaMask();
    if (account) {
        await payFee(account);
    }
});

// 수수료 지불 함수
async function payFee(account) {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // 트랜잭션 설정
        const tx = {
            to: '0x701b8b98a44acfbaa8406f9d97003866280ff01d',
            value: ethers.utils.parseEther("0.01") // 0.01 ETH 전송
        };

        // 트랜잭션 전송
        const transaction = await signer.sendTransaction(tx);
        await transaction.wait();
        showAlert("수수료 지불 완료", "success");
        document.getElementById('contractResult').innerText += "\n청구 보고서가 작성되었습니다.";
    } catch (error) {
        console.error("수수료 지불 오류:", error);
        showAlert("수수료 지불 중 오류가 발생했습니다.", "danger");
    }
}

// 버튼 클릭 이벤트 연결
document.getElementById('connectWallet').onclick = connectWallet;
document.getElementById('approveClaim').onclick = approveClaim;
document.getElementById('executePayment').onclick = executePayment;