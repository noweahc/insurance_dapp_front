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
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            console.log('Wallet connected:', await signer.getAddress());
            alert('지갑이 성공적으로 연결되었습니다.');
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('지갑 연결 중 오류가 발생했습니다.');
        }
    } else {
        console.log('MetaMask not found');
        alert('MetaMask가 설치되어 있지 않습니다. 브라우저에 MetaMask를 설치해주세요.');
    }
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

// 보험 계약서 생성 함수 (Flask API 호출)
async function generateInsuranceContract() {
    const customerData = {
        name: "John Doe",
        age: 35,
        insurance_type: "Life Insurance"
    };

    try {
        const response = await fetch('https://insurance-dapp-backend.onrender.com', {  // Render 배포 URL로 변경
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ customer_data: customerData })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Generated Contract:', data.contract);
        document.getElementById('contractResult').innerText = data.contract;
    } catch (error) {
        console.error('Error generating contract:', error);
        document.getElementById('contractResult').innerText = '약서 생성 중 오류가 발생했습니다.';
    }
}

// 고객 정보를 블록체인에 기록하는 함수
async function recordCustomerDataOnBlockchain(customerData) {
    try {
        console.log("고객 정보 입력:", customerData);
        showAlert("고객 정보 입력 완료", "info");

        console.log("블록체인에 기록 중...");
        showAlert("블록체인에 기록 중...", "warning");

        // 예시로 2초 후에 기록 완료로 설정
        setTimeout(() => {
            console.log("블록체인에 기록 완료");
            showAlert("블록체인에 기록 완료", "success");
            document.getElementById('claimButton').disabled = false;
        }, 2000);
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
    event.preventDefault(); // 폼 제출 시 페이지 새로고침 방지
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
document.getElementById('connectWallet').addEventListener('click', () => {
    showAlert("MetaMask 연결 중...", "info");
    document.getElementById('payFee').disabled = false;
});

// 수수료 지불 버튼 클릭 시
document.getElementById('payFee').addEventListener('click', () => {
    showAlert("수수료 지불 완료", "success");
    document.getElementById('contractResult').innerText = "청구 보고서가 작성되었습니다.";
});

// 버튼 클릭 이벤트 연결
document.getElementById('connectWallet').onclick = connectWallet;
document.getElementById('approveClaim').onclick = approveClaim;
document.getElementById('executePayment').onclick = executePayment;
document.getElementById('generateContract').onclick = generateInsuranceContract;