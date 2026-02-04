from typing import TypedDict, List


class SystemMetrics(TypedDict):
    cpu_percent: float
    cpu_details: dict
    memory_usage: dict
    disk_usage: dict
    boot_time: float
    timestamp: str


class PodStatus(TypedDict):
    running: int
    pending: int
    failed: int
    succeeded: int
    unknown: int


class KubernetesInfo(TypedDict):
    namespace: str
    num_deployments: int
    num_services: int
    num_pods: int
    pod_statuses: PodStatus


class VulnerabilityCount(TypedDict):
    critical: int
    high: int
    medium: int
    low: int


class ScanResult(TypedDict):
    image: str
    timestamp: str
    vulnerabilities: VulnerabilityCount
    details: dict
